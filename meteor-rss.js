Feeds = new Mongo.Collection("feeds");
News = new Mongo.Collection("news");

if (Meteor.isClient) {

  Template.body.helpers({
    feeds: function() {
      return Feeds.find({});
    }

  });
  Template.feed.helpers({
    news: function(feedId) {
      console.log(feedId);
      return News.find({feedId: feedId});
    }
  });
  Template.body.events({
    "click .submitFeed": function (event, template) {
      var newUrl = template.find("#newfeed").value;
      if (newUrl != "")
      {
        Meteor.call("addFeed", newUrl, function(error, result) {
          if (error != undefined)
          {
            console.log("Error adding feed " + error);
            // TODO: Show error
          }
        });
      }
      template.find("#newfeed").value = "";
      Session.set(this._id, 10);
      console.log(newUrl);

      return false;
    },
    "click .updateFeed": function (event) {
      var showAmount;

      if (Session.get(this._id) == undefined)
      {
        showAmount = 10;
        Session.set(this._id, showAmount);
      } else {
        showAmount = Session.get(this._id);
      }

      Meteor.call("updateFeed", this._id, showAmount);

      return false;
    },
    "click .clearFeed": function (event) {
      Meteor.call("clearFeed", this._id);

      Session.set(this._id, undefined)

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
    "click .showMore": function (event) {
      var showAmount;
      if (Session.get(this._id) == undefined)
      {
        Session.set(this._id, 10);
        showAmount = 10;
      } else {
        showAmount = Session.get(this._id)+10;
      }

      console.log(showAmount);
      Meteor.call("updateFeed", this._id, showAmount);
      Session.set(this._id, showAmount);

      return false;
    }
  });

  Template.ifLess.helpers({isLess: function (value) {
    return (value < 10);
  }});
}

var addFeed = function(url, meta) {
  console.log("Lisäys");
  Fiber(function() {
    Feeds.insert({
      url: url,
      title: meta.title,
      link: meta.link,
    });
  }).run();
};

var addNews = function(title, link, date, feedId, index) {
  console.log("Lisäys " + title);

  Fiber(function() {
    News.remove({
      link: link,
      feedId: feedId
    });
    News.insert({
      link: link,
      title: title,
      date: date,
      feedId: feedId,
      _index: index
    });
  }).run();
};

if (Meteor.isServer) {
  var FeedParser = Meteor.npmRequire('feedparser');
  var Request = Meteor.npmRequire('request');
  var Fiber = Meteor.npmRequire('fibers')

  var meta = "";
  var feedparser;
  var req;
  var stream;
  Meteor.methods({
    addFeed:function(url){
      feedparser = new FeedParser();
      req = Request(url);

      req.on('error', function (error) {
        console.log("Error loading url");
      });
      req.on('response', function (res) {
        stream = this;

        stream.pipe(feedparser);
      });

      feedparser.on('error', function(error) {
        console.log(error, error.stack);
      });
      feedparser.on('end', function() {

      });
      feedparser.on('readable', function() {
        meta = this.meta;
        addFeed(url, meta);

      });
    },
    updateFeed:function(feedId, showIndex) {
      feedparser = new FeedParser();
      var index = 0;
      console.log("Update: " + feedId);
      var curFeed = Feeds.findOne(feedId);

      req = Request(curFeed.url);

      req.on('error', function (error) {
        console.log("Error loading url");
      });
      req.on('response', function (res) {
        stream = this;
        stream.pipe(feedparser);
      });

      feedparser.on('error', function(error) {
        console.log(error, error.stack);
      });
      feedparser.on('end', function() {
        console.log("Ended reading feed");
      });
      feedparser.on('readable', function() {
        var item;

        while (item = this.read())
        {
          if (index < showIndex)
          {
            addNews(item.title, item.link, item.date, feedId, index);
            index++;
          }
        }
      });

    },
    showMore:function(feedId) {

    },
    clearFeed:function(feedId) {
      console.log("Clear: " + feedId);
      News.remove({
        feedId: feedId
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
    }
  });

  Meteor.startup(function () {
    // code to run on server at startup
  });
}
