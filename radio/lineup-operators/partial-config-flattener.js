var fs = require('fs');

var OOUtils = require('../../utils');
var Logger = require('../../logger');

var Stage = require('../staged-executor').Stage;

// This class is responsible if reading all partial config files and create one config object based on them
var PartialConfigFlattener = function() {
    Stage.call(this, "PartialConfigFlattener");
}
OOUtils.inheritsFrom(PartialConfigFlattener, Stage);

PartialConfigFlattener.prototype.perform = function(templateConfig) {
    
    partialConfigFilePrefix = this.context.cwd + "/conf/partials/";

    var flatTemplateConfig = {};
    // What a way to duplicate the json!
    flatTemplateConfig = JSON.parse(JSON.stringify(templateConfig));

    // unset the partials part
    delete flatTemplateConfig.Media.Partials;
    
    for (var i = 0; i < templateConfig.Media.Partials.length; i++) {
        var partialConf = JSON.parse(fs.readFileSync(partialConfigFilePrefix + templateConfig.Media.Partials[i].PartialConfigPath, 'utf-8'));
        flatTemplateConfig.Media[templateConfig.Media.Partials[i].Name] = partialConf;
    }

    return flatTemplateConfig;
}

module.exports = {
    "PartialConfigFlattener": PartialConfigFlattener
}