const fs = require('fs');
const path = require('path');
const defaultPackageJSONContent = require('../package.json');

exports.GeneratePackageJsonPlugin = class {
    constructor(options) {
        this.options = options || {};
    }

    apply(compiler) {
        compiler.hooks.afterEmit.tapAsync('GeneratePackageJsonPlugin', (compilation, callback) => {
            const packageJsonContent = Object.assign({}, defaultPackageJSONContent, this.options);
            delete packageJsonContent.devDependencies;
            delete packageJsonContent.scripts;
            delete packageJsonContent.scripts;

            const outputPath = path.join(compiler.options.output.path, 'package.json');
            const packageJsonString = JSON.stringify(packageJsonContent, null, 2);

            fs.writeFile(outputPath, packageJsonString, (err) => {
                if (err) {
                    return callback(err);
                }
                callback();
            });
        });
    }
}
