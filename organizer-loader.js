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
    let id = query.id;
    let rules = self.options.organizerRules[id] || {};
    
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
            let resourcePath = self.resourcePath.replace(rule.context, '');
            let rootSearch = resourcePath.lastIndexOf(rule.search);

            if (rule.search) {
                if (rootSearch > -1) {
                    let rootPath = resourcePath.substring(rootSearch + rule.search.length, resourcePath.length).replace(/^\//i, '');
                    let rootName = rootPath.substring(0, rootPath.indexOf('/')).replace(/\//gmi, '');
                    let rootRelativePath = rootPath.replace(rootName, '').replace(/^\//i, '');

                    url = getUrl(rule)
                        .replace(/\[root-name\]/gmi, rootName)
                        .replace(/\[root-relative-path\]/gmi, rootRelativePath);
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
