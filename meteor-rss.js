
Feeds = new Mongo.Collection("feeds");
News = new Mongo.Collection("news");




if (Meteor.isClient) {
  Meteor.subscribe( "feeds" );
  Meteor.subscribe( "news" );

  Template.body.helpers({

    feeds: function() {
      return Feeds.find({});
    }
  });

  Template.feed.helpers({
    news: function(feedId) {

      console.log(feedId);
      return News.find({feedId: feedId}, {sort: {publishedDate: -1}});
    }
  });

  Template.body.events({

    "click .submitFeed": function (event, template) {
      var url = template.find("#newfeed").value;
      if (url != "")
      {
        $.ajax({
              	type: "GET",
              	url: "http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=10&q="+url,
              	dataType: "jsonp",
              	success: function( data ) {
                  if ( data['responseStatus'] !== 200 ) {
                    alert( "Could not fetch feed from "+url+". Try again." );
                  } else {
                    var feed = data['responseData'];
                    var title = data['responseData']['feed']['title'];
                    var articleCount = data['responseData']['feed']['entries'].length;
                    //console.log("Article count: "+articleCount);
                    //console.log(title);
                    Meteor.call( 'addFeed', {
                      url: url,
                      title: title,
                      articleCount: articleCount
                    });

                  }
                }
              });
      }
      template.find("#newfeed").value = "";

      console.log(url);

      return false;
    },
    "click .updateFeed": function (event) {
      var url = Feeds.findOne({_id: this._id}).link;
      var feedId = Feeds.findOne({_id: this._id})._id;
      console.log("Url: " + url);

      var lastPublished = Feeds.findOne({_id: this._id}).lastPublishedDate;
      var newLastPublished;

      //  Meteor.call("updateFeed", this._id, showAmount);
      if (url != "")
      {
        $.ajax({
                type: "GET",
                url: "http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=10&q="+url,
                dataType: "jsonp",
                success: function( data ) {
                  if ( data['responseStatus'] !== 200 ) {
                    console.log( "Could not fetch feed from "+url+". Try again." );
                  } else {
                    var feed = data['responseData'];
                    var articles = data['responseData']['feed']['entries'];
                    var articleCount = articles.length;
                    console.log(articleCount);
                    for ( var i = 0; i < articleCount; i++)
                    {
                      if (i === 0)
                      {
                        newLastPublished = Date.parse( articles[i]['publishedDate']);
                      }

                      if (Date.parse(articles[i]['publishedDate']) > lastPublished || lastPublished == null)
                      {


                        Meteor.call('addNews', {
                            feedId: feedId,
                            title: articles[i]['title'],
                            url: articles[i]['link'],
                            publishedDate: articles[i]['publishedDate']
                          });
                      }

                      if ( i === (articleCount -1))
                      {
                        Meteor.call( 'setLastPublishedDate', feedId, newLastPublished);
                      }
                    }
                    //console.log("Article count: "+articleCount);
                    //console.log(title);


                  }
                }
              });

      }
      $( ".updated-" + this._id ).show();
      $( ".updated-" + this._id ).fadeOut( 2000, function() {
      });
      return false;
    },
    "click .clearFeed": function (event) {
      Meteor.call("clearFeed", this._id);
      Meteor.call( 'setLastPublishedDate', this._id, 0);

      return false;
    },
    "click .removeFeed": function (event) {
      Meteor.call("removeFeed", this._id);

      return false;
    },
    "click .hideFeed": function (event) {
      if ( $( "#" + this._id ).is( ":hidden" ) ) {
        $( "#" + this._id ).show();
        $(".hide-" + this._id).removeClass("active");
      } else {
        $( "#" + this._id ).hide();
        $(".hide-" + this._id).addClass("active");
      }
      return false;
    },
    "click .news_link": function (event) {
      $(".news_iframe").attr('src', this.url);
      Meteor.call("setAsRead", this._id);
      console.log("Changed to: " + this.url);
    },
    "click .deleteNews": function (event) {
      Meteor.call("deleteNews", this._id);
      return false;
    },
    "click .markAsRead": function (event) {
      Meteor.call("markAsRead", this._id);
      return false;
    }
  });


}

Meteor.methods({
  addFeed: function(options){
    options = options || {};
      console.log(options);
    //  pubDate = Date.parse( options.publishedDate );
      return Feeds.insert({
        link: options.url,
        title: options.title,
        lastPublishedDate: undefined
      //  feedId: options.feedId,
      });
  },
  removeFeed:function(feedId) {
    console.log("Removed: " + feedId);
    News.remove({
      feedId: feedId
    });
    Feeds.remove({
      _id: feedId
    });
  },
  clearFeed:function(feedId) {
    console.log("Clear: " + feedId);
    News.remove({
      feedId: feedId
    });
  },
  addNews: function( options ) {
    options = options || {};
    pubDate = Date.parse( options.publishedDate );
    return News.insert({
      //  owner: Meteor.userId(),
        feedId: options.feedId,
        title: options.title,
        url: options.url,
        publishedDate: pubDate,
        read: false
    });
  },
  setLastPublishedDate: function( feedId, lastPublishedDate ) {
    return Feeds.update( feedId, {
      $set: { lastPublishedDate: lastPublishedDate }
    });
  },
  setAsRead: function( newsId ) {

    return News.update( newsId, {
      $set : { read : true }
      });
  },
  deleteNews: function( newsId ) {
    News.remove({
      _id: newsId
      });
  },
  markAsRead: function ( feedId ) {
    console.log("Marked all read: " + feedId);
    return News.update ( {'feedId': feedId }, {
      $set: { read : true}
      },
      { multi: true });

  }

});


if (Meteor.isServer) {

  Meteor.startup(function () {
    // code to run on server at startup
  });
}
