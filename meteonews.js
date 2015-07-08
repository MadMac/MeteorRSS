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
        Meteor.call("addFeed", newUrl);
      }
      template.find("#newfeed").value = "";
      console.log(event);

      return false;
    },
    "click .updateFeed": function (event) {
      Meteor.call("updateFeed", this._id);

      return false;
    }
  });
}

var addFeed = function(url, meta) {
  console.log("Lisäys");
  Fiber(function() {
    Feeds.insert({
      url: url,
      title: meta.title,
      link: meta.link
    });
  }).run();
};

var addNews = function(title, link, date, feedId) {
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
      feedId: feedId
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
    updateFeed:function(feedId) {
      feedparser = new FeedParser();
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
          addNews(item.title, item.link, item.date, feedId);
        }
      });

    }
  });

  Meteor.startup(function () {
    // code to run on server at startup
  });
}
