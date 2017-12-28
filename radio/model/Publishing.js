const SerializableObject = require('./SerializableObject');

const Context = require('./Context');

class Publishing extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    validate() {
        if (this.SocialListeningMode === 'Personal' &&
                !this.PersonalSchedulingHandler) {
            throw Error('Personal listening mode requires ' +
                'PersonalSchudulingHandler property to be set.');
        }
    }

    get Archive() {
        return this.getOrElse(this._archive, false);
    }

    set Archive(value) {
        this._archive = value;
    }

    get Podcast() {
        return this.getOrElse(this._podcast, false);
    }

    set Podcast(value) {
        this._podcast = value;
    }

    get PodcastFeed() {
        this.getOrElse(this._podcastFeedm,
         Object.assign({}, Context.Defaults.Publishing.PodcastFeed));
    }

    set PodcastFeed(value) {
        this._podcastFeed = value;
    }

    get SocialListeningMode() {
        return this.getOrElse(this._socialListeningMode, 'Social');
    }

    set SocialListeningMode(value) {
        if (value && !['Social', 'Personal', 'None'].contains(value)) {
            throw Error('Invalid Social Listening mode.' +
                'Acceptable values are "Social", "Personal" and "None"');
        }
        this._socialListeningMode = value;
    }

    get PersonalSchedulingHandler() {
        return this.getOrNull(this._personalSchedulingHandler);
    }

    set PersonalSchedulingHandler(value) {
        this._personalSchedulingHandler = value;
    }

    get SocialListeningProps() {
        return this.getOrElse(this._socialListeningProps,
         Object.assign({}, Context.Defaults.Publishing.SocialListeningProps));
    }

    set SocialListeningProps(value) {
        if (!value) {
            value = {};
        }

        value.DefaultLife = value.DefaultLife ?
            Context.Defaults.Publishing.SocialListeningProps.DefaultLife :
            value.DefaultLife;
        value.MaxLife = value.MaxLife ?
            Context.Defaults.Publishing.SocialListeningProps.MaxLife :
            value.MaxLife;
        value.VoteEffect = value.VoteEffect ?
            Context.Defaults.Publishing.SocialListeningProps.VoteBonus :
            value.VoteBonus;

        this._value = value;
    }
}

module.exports = Publishing;
