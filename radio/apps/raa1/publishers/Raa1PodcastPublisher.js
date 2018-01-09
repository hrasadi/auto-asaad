const Context = require('../../../Context');

const PodcastPublisher = require('../../../publishers/PodcastPublisher');

const RollingList = require('./RollingList');

const RSS = require('rss');

const fs = require('fs');
const moment = require('moment');
const {URL} = require('url');

class Raa1PodcastPublisher extends PodcastPublisher {
    constructor() {
        super();

        this._rollingLists = {};
    }

    doPublish(program, targetDate) {
        // push program in rolling lineup
        let feedName = program.Publishing.PodcastFeed;
        if (!this._rollingLists[feedName]) {
            this._rollingLists[feedName] =
                    new RollingList(feedName, targetDate,
                                        Context.CWD + '/run/podcast/',
                                        Context.MaxPodcastEntries);
        }

        this._rollingLists[feedName].addItem(program);
    }

    commit() {
        for (let feedName in this._rollingLists) {
            if (this._rollingLists.hasOwnProperty(feedName)) {
                this._rollingLists[feedName].flush();
                this.generateRSS(feedName);
            }
        }
    }

    generateRSS(feedName) {
        let feedRSSFilePath = Context.CWD + '/run/rss/' + feedName + '.xml';

        let feed = this.createFeedGenerator();
        if (this._rollingLists[feedName].Items) {
            for (let i = 0;
                    i < this._rollingLists[feedName].Items.length; i++) {
                    feed.item(this.getRSSItem(
                                this._rollingLists[feedName].Items[i]));
            }
        }

        let xml = feed.xml({indent: true});
        fs.writeFileSync(feedRSSFilePath, xml);
    }

    createFeedGenerator() {
        return new RSS({
            title: 'رادیو اتو-اسعد',
            custom_namespaces: {
                'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd',
            },
            description: 'پادکست‌های رادیو اتو-اسعد شامل برنامه‌هایی ' +
                        'است که امکان پخش عمومی آن‌ها برای ما وجود داشته است.',
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

    getRSSItem(program) {
        let rssFeedItem = {
            author: 'رادیو اتو-اسعد',
            custom_elements: [
              {'itunes:author': 'رادیو اتو-اسعد'},
              {'itunes:image': {
                _attr: {
                  href: 'http://raa.media/img/raa-cover-itunes.png',
                },
              }},
            ],
        };

        rssFeedItem.title = program.Title;

        // Clips[0] is the combined clip
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

module.exports = Raa1PodcastPublisher;
