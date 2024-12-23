import plugin from '../plugin.json';
import style from './style.scss';

const { editor } = editorManager;
const settings = acode.require('settings');
const alert = acode.require('alert');
const prompt = acode.require('prompt');

const THEME_NAME = 'acode-the-box';
const THEME_PATH = `ace/theme/${THEME_NAME}`;

ace.define(
  `ace/theme/${THEME_NAME}.css`,
  ['require', 'exports', 'module'],
  function (require, exports, module) {
    module.exports = style;
  },
);

ace.define(
  THEME_PATH,
  [
    'require',
    'exports',
    'module',
    `ace/theme/${THEME_NAME}.css`,
    'ace/lib/dom',
  ],
  function (require, exports, module) {
    const cssText = require(`ace/theme/${THEME_NAME}.css`);
    const dom = require('ace/lib/dom');

    exports.isDark = true;
    exports.cssClass = `ace-${THEME_NAME}`;
    exports.cssText = cssText;

    dom.importCssString(cssText, exports.cssClass, false);
  },
);

(async () => {
  await new Promise(resolve => {
    window.require([THEME_PATH], m => {
      resolve(m);
    });
  });
})();

class AcodePlugin {
  constructor() {
    this.themeName = THEME_NAME;
    this.themePath = THEME_PATH;
    this.isInitialized = false;
  }

  async init($page) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    ace.require('ace/ext/themelist').themes.push({
      caption: this.themeName
        .split('-')
        .map(name => name[0].toUpperCase() + name.slice(1))
        .join(' '),
      theme: this.themePath,
      isDark: true,
    });

    const currentTheme = settings.get('editorTheme');
    if (currentTheme === this.themeName) {
      editor.setTheme(this.themePath);
    }

    settings.on('update', this.onThemeChange.bind(this));

    await this.showSuccessAlert();
    await this.showCommentPrompt();
  }

  async destroy() {
    if (!this.isInitialized) return;
    this.isInitialized = false;

    settings.off('update', this.onThemeChange.bind(this));
  }

  onThemeChange(value) {
    if (value === this.themePath) {
      editor.setTheme(this.themePath);
      settings.update({ editorTheme: this.themeName });
    }
  }

  async showSuccessAlert() {
    return new Promise(resolve => {
      alert(
        'Acode The Box - !SUCCESS INSTALLED',
        `This theme puts the focus on your code, no distractions or overly saturated colors that might look good in a preview, but in reality, burns your eyes after a day of coding.`,
        () => {
          window.toast('Alert modal closed', 4000);
          resolve();
        },
      );
    });
  }

  async showCommentPrompt() {
    const userComment = await prompt('Leave a comment:', '', 'text', {
      required: true,
      placeholder: 'Enter your comment here',
    });

    if (userComment) {
      window.open(
        `https://acode.app/plugin/whodaff.plugin.acodethebox/comments?comment=${encodeURIComponent(
          userComment,
        )}`,
        '_blank',
      );
    }
  }
}

if (window.acode) {
  const acodePlugin = new AcodePlugin();

  acode.setPluginInit(
    plugin.id,
    (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
      if (!baseUrl.endsWith('/')) {
        baseUrl += '/';
      }
      acodePlugin.baseUrl = baseUrl;
      acodePlugin.init($page);
    },
  );

  acode.setPluginUnmount(plugin.id, () => {
    acodePlugin.destroy();
  });
}
