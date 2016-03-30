/**
 *
 * Organizer Loader for Webpack
 * @author: Alessandro Bellini - ilmente <hello@ilmente.it>
 *
 */

'use strict';

let path = require('path');
let loaderUtils = require('loader-utils');

module.exports = function(content) {
    let self = this;
    self.cacheable && self.cacheable();

    if (!self.emitFile) {
        throw new Error('organizer-loader -> emitFile is required from module system');
    }

    if (!self.options.organizerRules) {
        throw new Error('organizer-loader -> organizerRules are missing: add them to your configuration');
    }

    let url;
    let query = loaderUtils.parseQuery(self.query);
    let rulesId = query.rules;
    let rules = self.options.organizerRules[rulesId] || [];
    
    function getUrl(rule) {
        return loaderUtils.interpolateName(self, rule.name || '[name].[ext]', {
            content: content,
            context: rule.context,
            regExp: ''
        });
    }

    rules.forEach(function(rule) {
        rule.context = rule.context || self.options.context;

        if (!url) {
            if (rule.container) {
                let resourcePath = self.resourcePath.replace(rule.context, '');
                let bundleMatches = resourcePath.match(rule.container) || [];
                let bundleMatch = '';
                let bundleStartIndex = -1;

                if (bundleMatches.length > 0) {
                    bundleMatch = bundleMatches[bundleMatches.length -1];
                    bundleStartIndex = resourcePath.lastIndexOf(bundleMatch);
                }

                if (bundleMatch && bundleStartIndex > -1) {
                    let bundleFullPath = resourcePath.substring(bundleStartIndex + bundleMatch.length, resourcePath.length).replace(/^\//i, '');
                    let bundleName = bundleFullPath.substring(0, bundleFullPath.indexOf('/')).replace(/\//gmi, '');
                    let bundleRelativePath = bundleFullPath.replace(bundleName, '').replace(/^\//i, '');

                    url = getUrl(rule)
                        .replace(/\[bundle\]/gmi, bundleName)
                        .replace(/\[bundle-path\]/gmi, bundleRelativePath)
                        .replace(/\/\//gmi, '/');
                }
            } else {
                url = getUrl(rule);
            }
        }
    });

    if (!url) {
        throw new Error(`organizer-loader -> ${self.resourcePath} cannot be loaded: define a rule to handle it`);
    }

    self.emitFile(url, content);
    return 'module.exports = __webpack_public_path__ + ' + JSON.stringify(url) + ';';
}

module.exports.raw = true;
