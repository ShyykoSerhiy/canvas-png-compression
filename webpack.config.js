var path = require("path");
module.exports = {
    entry: './src/main.ts',
    output: {
        path: path.join(__dirname, "dist"),
        publicPath: "dist/"
    },
    resolve: {
        // Add `.ts` and `.tsx` and `.css` as a resolvable extension.
        extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.css']
    },
    module: {
        loaders: [
            // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
            {test: /\.tsx?$/, loader: 'babel-loader!ts-loader'}
        ]
    }
};
