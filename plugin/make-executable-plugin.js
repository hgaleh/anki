const fs = require('fs');
const path = require('path');

exports.MakeExecutablePlugin = class {
    constructor(outputFilename) {
        this.outputFilename = outputFilename;
    }

    apply(compiler) {
        compiler.hooks.afterEmit.tap('MakeExecutablePlugin', (compilation) => {
            const outputPath = path.join(compiler.options.output.path, this.outputFilename);

            fs.chmod(outputPath, '755', (err) => {
                if (err) {
                    console.error(`Failed to make ${outputPath} executable:`, err);
                } else {
                    console.log(`${outputPath} is now executable`);
                }
            });
        });
    }
};
