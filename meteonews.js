Feeds = new Mongo.Collection("feeds");

if (Meteor.isClient) {

  Template.body.helpers({
    feeds: function() {
      return Feeds.find({});
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

    }
  });
}



if (Meteor.isServer) {
  var FeedParser = Meteor.npmRequire('feedparser');
  var Request = Meteor.npmRequire('request');
  var Fiber = Meteor.npmRequire('fibers')

  var feedparser = new FeedParser();

  Meteor.methods({
    addFeed:function(url){
      var req = Request(url);

      req.on('error', function (error) {
        console.log("Error loading url");
      });
      req.on('response', function (res) {
        var stream = this;

        stream.pipe(feedparser);
      });


      feedparser.on('error', function(error) {
        console.log(error, error.stack);
      });
      feedparser.on('readable', function() {
        var meta = this.meta;
        Fiber(function() {
          Feeds.insert({
            url: url,
            title: meta.title,
            link: meta.link
          });
        }).run();
      });
      //feedparser.parseUrl(url).on('meta', addFeed(url));
    }
  });

  Meteor.startup(function () {
    // code to run on server at startup
  });
}
