const FEED_CHECKING_FREQUENCY = 60000; // One minute
class Feed {
    constructor() {
        setInterval(this.tick, FEED_CHECKING_FREQUENCY);
    }

    tick() {
        // check time
        // check last persisted time (should be one minute before)
        // check for new released programs
        // check for expired programs
        // if more that one minute, cleanup at the end (too late to notify people)
    }
}
module.exports = Feed;
