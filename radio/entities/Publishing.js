const Entity = require('./Entity');

const AppContext = require('../AppContext');

class Publishing extends Entity {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    validate() {
        if (this.CollaborativeListeningFeed === 'Personal' &&
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
        let defaultFeed = this._podcast ?
                            AppContext.getInstance('LineupGenerator')
                            .Defaults.Publishing.PodcastFeed : null;
        return this.getOrElse(this._podcastFeed, defaultFeed);
    }

    set PodcastFeed(value) {
        this._podcastFeed = value;
    }

    get CollaborativeListeningFeed() {
        return this.getOrElse(this._collaborativeListeningFeed, 'None');
    }

    set CollaborativeListeningFeed(value) {
        if (value && !['Public', 'Personal', 'None'].includes(value)) {
            throw Error('Invalid CollaborativeListening feed.' +
                'Acceptable values are "Public", "Personal" and "None"');
        }
        this._collaborativeListeningFeed = value;
    }

    get PersonalSchedulingHandler() {
        return this.getOrNull(this._personalSchedulingHandler);
    }

    set PersonalSchedulingHandler(value) {
        this._personalSchedulingHandler = value;
    }

    get ColloborativeListeningProps() {
        let defaultCLProps = this._collaborativeListeningFeed !== 'None' ?
                            Object.assign({}, AppContext.getInstance('LineupGenerator')
                            .Defaults.Publishing.ColloborativeListening) : null;
        return this.getOrElse(this._collaborativeListeningProps, defaultCLProps);
    }

    set ColloborativeListeningProps(value) {
        if (!value) {
            value = {};
        }

        value.DefaultLife = value.DefaultLife ?
            AppContext.getInstance('LineupGenerator')
                    .Defaults.Publishing.ColloborativeListening.DefaultLife :
            value.DefaultLife;
        value.MaxLife = value.MaxLife ?
            AppContext.getInstance('LineupGenerator')
                    .Defaults.Publishing.ColloborativeListening.MaxLife :
            value.MaxLife;
        value.UpvoteBonus = value.UpvoteBonus ?
            AppContext.getInstance('LineupGenerator')
                    .Defaults.Publishing.ColloborativeListening.UpvoteBonus :
            value.UpvoteBonus;

        this._value = value;
    }
}

module.exports = Publishing;
