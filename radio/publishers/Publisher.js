const Context = require('../Context');

const RSS = require('rss');

const moment = require('moment');
const fs = require('fs');
class Publisher {
    constructor(clipMerger) {
        this._clipMerger = clipMerger;

        this._rollingListsDict = {};
    }

    publish(program, targetDate) {
    }

    commit() {
    }

    generateRSS(feedName, feedMode) {
        let feedRSSFilePath = Context.CWD + '/run/rss/' + feedName + '.xml';

        let feed = this.createFeedGenerator(feedName, feedMode);
        if (this._rollingListsDict[feedName].Items) {
            for (let i = 0; i < this._rollingListsDict[feedName].Items.length; i++) {
                feed.item(this.getRSSItem(
                            this._rollingListsDict[feedName].Items[i], feedMode));
            }
        }

        let xml = feed.xml({indent: true});
        fs.writeFileSync(feedRSSFilePath, xml);
    }

    createFeedGenerator(feedName, feedMode) {
      let feedDescription = 'پادکست‌های رادیو اتو-اسعد شامل برنامه‌هایی ' +
                            'است که امکان پخش عمومی آن‌ها برای ما وجود داشته است.';

      if (feedMode == 'SingleProgram') {
        if (Context.RadioApp.ProgramInfoDirectory.ProgramInfos[feedName]) {
          if (Context.RadioApp.ProgramInfoDirectory.ProgramInfos[feedName].About) {
            feedDescription =
                  Context.RadioApp.ProgramInfoDirectory.ProgramInfos[feedName].About;
          }
        }
      }

      return new RSS({
          title: 'رادیو اتو-اسعد',
          custom_namespaces: {
              'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd',
          },
          description: feedDescription,
          feed_url: 'http://raa.media/rss.xml',
          site_url: 'http://raa.media',
          image_url: 'http://raa.media/img/raa-cover-itunes.png',
          copyright: '2017 Radio Auto-asaad',
          language: 'fa',
          pubDate: 'Aug 01, 2017 04:00:00 GMT',
          ttl: '60',
          custom_elements: [
            {'itunes:subtitle': 'پادکست‌های رادیو اتو-اسعد'},
            {'itunes:author': 'اتو-اسعد'},
            {'itunes:explicit': false},
            {'itunes:owner': [
              {'itunes:name': 'Radio Auto-asaad'},
              {'itunes:email': 'admin@raa.media'},
            ]},
            {'itunes:image': {
              _attr: {
                href: 'http://raa.media/img/raa-cover-itunes.png',
              },
            }},
            {'itunes:category': [
              {_attr: {
                text: 'Arts',
              }},
              {'itunes:category': {
                _attr: {
                  text: 'Literature',
                },
              }},
            ]},
          ],
        });
    }

    getRSSItem(program, feedMode) {
        let displayThumbnail = null;
        if (Context.RadioApp.ProgramInfoDirectory[program.ProgramId]) {
            displayThumbnail = Context.RadioApp
                            .ProgramInfoDirectory[program.ProgramId].Thumbnail;
        } else {
            displayThumbnail = 'http://raa.media/img/raa-cover-itunes.png';
        }

        let rssFeedItem = {
            author: 'رادیو اتو-اسعد',
            custom_elements: [
              {'itunes:author': 'رادیو اتو-اسعد'},
              {'itunes:image': {
                _attr: {
                  href: displayThumbnail,
                },
              }},
            ],
        };

        rssFeedItem.title =
                    feedMode == 'SingleProgram' ?
                    program.Show.Clips[0].Media.ShortDescription : program.Title;

        // Clips[0] is the merged clip
        rssFeedItem.description = program.Show.Clips[0].Description;
        rssFeedItem.url = program.Show.Clips[0].Media.Path;
        rssFeedItem.date = Date().toString();

        rssFeedItem.enclosure = {};
        rssFeedItem.enclosure.url = program.Show.Clips[0].Media.Path;

        let itunesSubtitleElement = {};
        itunesSubtitleElement['itunes:subtitle'] =
                                 program.Show.Clips[0].Media.Description;
        rssFeedItem.custom_elements.push(itunesSubtitleElement);

        let itunesDurationElement = {};
        let pduration = moment.duration(program.Metadata.Duration, 'seconds');
        itunesDurationElement['itunes:duration'] =
                                Math.floor(pduration.asMinutes()) +
                                ':' + pduration.seconds();
        rssFeedItem.custom_elements.push(itunesDurationElement);

        return rssFeedItem;
    }
}

module.exports = Publisher;
