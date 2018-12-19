import { existsSync } from "fs";
import webpack from "webpack";
import Memory from "memory-fs";

export class PackService {

  /**
   * Bundles the content using the Webpack
   *
   * @param {string} pathway
   * @param {string} name
   * @return {Promise<Buffer>}
   */
  public create(pathway: string, name: string): Promise<Buffer> {

    return new Promise((resolve, reject) => {

      const entry = process.cwd() + "/" + pathway;
      const segments = entry.split("/");
      const filename = segments.pop();
      const config = this.setup(segments);

      config.plugins = [];
      config.entry = entry;
      config.output = {
        path: "/output",
        filename: "component.js",
        libraryTarget: "var",
        library: name
      };

      const memory = new Memory();
      const compiler = webpack(config);

      compiler.outputFileSystem = memory;

      compiler.run((err, stats) => {
        if (err) {
          console.error(err.stack || err);
          if (err.details) {
            return reject(err.details);
          }
        }

        const info = stats.toJson();

        if (stats.hasErrors()) {
          return reject(info.errors);
        }

        if (stats.hasWarnings()) {
          //
        }

        return resolve(memory.readFileSync("/output/component.js"));
      });
    });

  }

  /**
   * Loads the webpack configuration
   *
   * @param {Array<string>} segments
   * @return any
   */
  private setup(segments: string[]): any {

    if (Array.isArray(segments) && segments.length > 0) {
      const pathway = segments.join("/") + "/webpack.config.js";

      if (existsSync(pathway)) {
        // config file found
        // temporary workaround
        const config = eval("require")(pathway.trim());

        if (Array.isArray(config)) {
          return config[0];
        } else {
          return config;
        }
      } else {
        segments.pop();
        return this.setup(segments);
      }

    } else {
      // config file was not found, returning default config
      return module.require("../configs/pack.config.js");
    }

  }

}
