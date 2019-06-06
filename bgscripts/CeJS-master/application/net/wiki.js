/**
 * @name CeL function for MediaWiki (Wikipedia / 維基百科)
 * 
 * @fileoverview 本檔案包含了 MediaWiki 自動化作業用的程式庫，主要用於編寫[[維基百科:機器人]]
 *               ([[WP:{{{name|{{int:Group-bot}}}}}|{{{name|{{int:Group-bot}}}}}]])。
 * 
 * TODO:<code>

wiki_API.work() 遇到 Invalid token 之類問題，中途跳出 abort 時，無法紀錄。應將紀錄顯示於 console 或 local file。
wiki_API.page() 整合各 action=query 至單一公用 function。
[[mw:Manual:Pywikibot/zh]]

parser 標籤中的空屬性現根據HTML5規格進行解析。<pages from= to= section=1>將解析為<pages from="to=" section="1">而不是像以前那樣的<pages from="" to="" section="1">。請改用<pages from="" to="" section=1> or <pages section=1>。這很可能影響維基文庫項目上的頁面。
parser 所有子頁面加入白名單 white-list
parser 所有node當前之level層級
parser 提供 .previousSibling, .nextSibling, .parentNode 將文件結構串起來。
parser [[WP:維基化]]
https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Check_Wikipedia
https://en.wikipedia.org/wiki/Wikipedia:AutoWikiBrowser/General_fixes
https://www.mediawiki.org/wiki/API:Edit_-_Set_user_preferences

[[mw:Help:OAuth]]
https://www.mediawiki.org/wiki/OAuth/Owner-only_consumers

Wikimedia REST API
https://www.mediawiki.org/wiki/RESTBase

https://zh.wikipedia.org/w/index.php?title=title&action=history&hilight=123,456


-{zh-hans:访问;zh-hant:訪問;zh-tw:瀏覽}-量
https://wikitech.wikimedia.org/wiki/Analytics/PageviewAPI
https://en.wikipedia.org/wiki/Wikipedia:Pageview_statistics
https://dumps.wikimedia.org/other/pagecounts-raw/
https://tools.wmflabs.org/pageviews
https://wikitech.wikimedia.org/wiki/Analytics/Data/Pagecounts-raw
https://meta.wikimedia.org/wiki/Research:Page_view

WikiData Remote editor
http://tools.wmflabs.org/widar/


get user infomation:
https://www.mediawiki.org/w/api.php?action=help&modules=query%2Busers
https://zh.wikipedia.org/w/api.php?action=query&format=json&list=users&usprop=blockinfo|groups|implicitgroups|rights|editcount|registration|emailable|gender|centralids|cancreate&usattachedwiki=zhwiki&ususers=username|username
https://www.mediawiki.org/w/api.php?action=help&modules=query%2Busercontribs
https://zh.wikipedia.org/w/api.php?action=query&format=json&list=usercontribs&uclimit=1&ucdir=newer&ucprop=ids|title|timestamp|comment|parsedcomment|size|sizediff|flags|tags&ucuser=username



雙重重定向/重新導向/転送
特別:二重リダイレクト
Special:DoubleRedirects
Special:BrokenRedirects
https://www.mediawiki.org/w/api.php?action=help&modules=query%2Bquerypage
[[mw:User:Duplicatebug/API Overview/action]]
https://test.wikipedia.org/w/api.php?action=query&list=querypage&qppage=DoubleRedirects&qplimit=max


gadgets 小工具 [[Wikipedia:Tools]], [[Category:Wikipedia scripts]], [[mw:ResourceLoader/Core modules]]
[[Special:MyPage/common.js]] [[使用說明:維基用戶腳本開發指南]]

// ---------------------------------------------------------

// https://doc.wikimedia.org/mediawiki-core/master/js/#!/api/mw.loader
mw.loader.load('https://kanasimi.github.io/CeJS/ce.js')
CeL.run('application.net.wiki');
CeL.wiki.page('Wikipedia:機器人',function(page_data){console.log(page_data);},{redirects:true,section:0})

// wikibits從2013年就棄用
// https://www.mediawiki.org/wiki/ResourceLoader/Legacy_JavaScript#wikibits.js
// NG: importScript('User:cewbot/*.js');

你可以在維基媒體的wiki網站URL最後增加?safemode=1來關閉你個人的CSS和JavaScript。範例：https://zh.wikipedia.org/wiki/文學?safemode=1。上面一行意思是你可以測試是否是你的使用者腳本或套件造成問題，而不必解除安裝。

</code>
 * 
 * @since 2015/1/1
 * @see https://www.mediawiki.org/w/api.php
 */

// More examples: see /_test suite/test.js
// Wikipedia bots demo: https://github.com/kanasimi/wikibot
'use strict';
// 'use asm';

// --------------------------------------------------------------------------------------------

// 不採用 if 陳述式，可以避免 Eclipse JSDoc 與 format 多縮排一層。
typeof CeL === 'function' && CeL.run({
	// module name
	name : 'application.net.wiki',

	// .includes() @ CeL.data.code.compatibility
	// .between() @ CeL.data.native
	// .append() @ CeL.data.native
	require : 'data.code.compatibility.|data.native.'
	// (new Date).format('%4Y%2m%2d'), (new Date).format() @ CeL.data.date
	// optional 選用: .show_value() @ CeL.interact.DOM, CeL.application.debug
	// optional 選用: CeL.wiki.cache(): CeL.application.platform.nodejs.fs_mkdir()
	// optional 選用: CeL.wiki.traversal(): CeL.application.platform.nodejs
	// optional 選用: wiki_API.work(): gettext():
	// CeL.application.locale.gettext()
	+ '|application.net.Ajax.get_URL'
	// CeL.date.String_to_Date(), Julian_day(): CeL.data.date
	+ '|data.date.',

	// 設定不匯出的子函式。
	no_extend : '*',

	// 為了方便格式化程式碼，因此將 module 函式主體另外抽出。
	code : module_code
});

function module_code(library_namespace) {

	// requiring
	var get_URL = this.r('get_URL'),
	//
	gettext = library_namespace.cache_gettext(function(_) {
		gettext = _;
	});

	var
	/** {Number}未發現之index。 const: 基本上與程式碼設計合一，僅表示名義，不可更改。(=== -1) */
	NOT_FOUND = ''.indexOf('_');

	// --------------------------------------------------------------------------------------------

	// 維基姊妹項目
	// TODO: 各種 type 間的轉換: 先要能擷取出 language code + family
	// @see language_to_site_name()
	//
	//
	// type: 'API', 'db', 'site', 'link', 'dump', ...
	// API URL (default): e.g., 'https://www.wikidata.org/w/api.php'
	//
	// https://www.wikidata.org/w/api.php?action=help&modules=wbgetentities
	// site: e.g., 'zhwiki'. `.wikiid` @ siteinfo
	// @see wikidatawiki_p.wb_items_per_site.ips_site_id
	//
	// [[en:Help:Interwikimedia_links]] [[en:Special:Interwiki]]
	// https://zh.wikipedia.org/wiki/Special:GoToInterwiki/testwiki:
	// link prefix: e.g., 'zh:n:' for zh.wikinews
	//
	// https://dumps.wikimedia.org/backup-index.html
	// dump: e.g., 'zhwikinews'
	//
	// SHOW DATABASES;
	// db: e.g., 'zhwiki_p'
	//
	//
	// language (or family/project): default: default_language
	// e.g., 'en', 'zh-classical', 'ja', ...
	//
	// project = language_code.family
	//
	// [[meta:List of Wikimedia projects by size]]
	// family: 'wikipedia' (default), 'news', 'source', 'books', 'quote', ...
	function get_project(language, family, type) {
		;
	}

	/** {String} old key: 'wiki' */
	var KEY_SESSION = 'session', KEY_HOST_SESSION = 'host';

	// https://github.com/Microsoft/TypeScript/wiki/JSDoc-support-in-JavaScript
	/**
	 * web Wikipedia / 維基百科 用的 functions。<br />
	 * 可執行環境: node.js, JScript。
	 * 
	 * @param {String}user_name
	 *            user name
	 * @param {String}password
	 *            user password
	 * @param {String}[API_URL]
	 *            language code or API URL
	 * 
	 * @returns {wiki_API}
	 * @template wiki_API
	 * 
	 * @constructor
	 */
	function wiki_API(user_name, password, API_URL) {
		library_namespace.debug('API_URL: ' + API_URL + ', default_language: '
				+ default_language, 3, 'wiki_API');
		if (!this || this.constructor !== wiki_API) {
			return wiki_API.query.apply(null, arguments);
		}

		this.token = {
			// lgusername
			lgname : user_name,
			lgpassword : password
		};

		// action queue 佇列。應以 append，而非整個換掉的方式更改。
		this.actions = [];

		// 紀錄各種後續檢索用索引值。應以 append，而非整個換掉的方式更改。
		// 對舊版本須用到 for (in .next_mark)
		this.next_mark = Object.create(null);

		// setup session.
		if (API_URL) {
			setup_API_language(this /* session */, API_URL);
			setup_API_URL(this /* session */, API_URL);
		}

		if (!('language' in this)
		// wikidata 不設定 language。
		&& !this.is_wikidata) {
			setup_API_language(this /* session */, default_language);
		}
	}

	/**
	 * 檢查若 value 為 session。
	 * 
	 * @param value
	 *            value to test. 要測試的值。
	 * 
	 * @returns {Boolean} value 為 session。
	 */
	function is_wiki_API(value) {
		return value
				&& ((value instanceof wiki_API) || value.API_URL && value.token);
	}

	var
	/**
	 * 匹配URL網址。
	 * 
	 * [http://...]<br />
	 * {{|url=http://...}}
	 * 
	 * matched: [ URL ]
	 * 
	 * @type {RegExp}
	 * 
	 * @see PATTERN_URL_GLOBAL, PATTERN_URL_WITH_PROTOCOL_GLOBAL,
	 *      PATTERN_URL_prefix, PATTERN_WIKI_URL, PATTERN_wiki_project_URL,
	 *      PATTERN_external_link_global
	 */
	PATTERN_URL_GLOBAL = /(?:https?:)?\/\/(?:[^\s\|<>\[\]{}]+|{[^{}]*})+/ig,

	/**
	 * 匹配URL網址，僅用於 parse_wikitext()。
	 * 
	 * "\0" 應該改成 include_mark。
	 * 
	 * matched: [ all, previous, URL, protocol without ":", others ]
	 * 
	 * @type {RegExp}
	 * 
	 * @see PATTERN_URL_GLOBAL, PATTERN_URL_WITH_PROTOCOL_GLOBAL,
	 *      PATTERN_URL_prefix, PATTERN_WIKI_URL, PATTERN_wiki_project_URL,
	 *      PATTERN_external_link_global
	 */
	PATTERN_URL_WITH_PROTOCOL_GLOBAL =
	// 照理來說應該是這樣的。
	/(^|[^a-z\d_])((https?|s?ftp|telnet|ssh):\/\/([^\0\s\|<>\[\]{}\/][^\0\s\|<>\[\]{}]*))/ig,
	// MediaWiki實際上會parse的。
	// /(^|[^a-z\d_])((https?|s?ftp|telnet|ssh):\/\/([^\0\s\|<>\[\]{}]+))/ig,

	/**
	 * 匹配以URL網址起始。
	 * 
	 * matched: [ prefix ]
	 * 
	 * @type {RegExp}
	 * 
	 * @see PATTERN_URL_GLOBAL, PATTERN_URL_WITH_PROTOCOL_GLOBAL,
	 *      PATTERN_URL_prefix, PATTERN_WIKI_URL, PATTERN_wiki_project_URL,
	 *      PATTERN_external_link_global
	 */
	PATTERN_URL_prefix = /^(?:(?:https?|s?ftp|telnet|ssh):)?\/\/[^.:\\\/]+\.[^.:\\\/]+/i;
	// ↓ 這會無法匹配中文域名。
	// PATTERN_URL_prefix = /^(?:https?:)?\/\/([a-z\d\-]{1,20})\./i,

	// 嘗試從 options 取得 API_URL。
	function API_URL_of_options(options) {
		// library_namespace.debug('options:', 0, 'API_URL_of_options');
		// console.log(options);
		if (!options) {
			return;
		}
		return options.API_URL
		// 此時嘗試從 options[KEY_SESSION] 取得 API_URL。
		|| options[KEY_SESSION] && options[KEY_SESSION].API_URL;
	}

	function get_data_API_URL(options, default_API_URL) {
		// library_namespace.debug('options:', 0, 'get_data_API_URL');
		// console.log(options);

		var API_URL;
		if (options) {
			var session = options[KEY_SESSION];
			if (is_wiki_API(session)) {
				if (session.data_session) {
					API_URL = session.data_session.API_URL;
				}
				if (!API_URL && session.is_wikidata) {
					API_URL = session.API_URL;
				}
			} else {
				API_URL = API_URL_of_options(options);
			}
		}

		// console.trace(API_URL);
		return API_URL || default_API_URL || wikidata_API_URL;
	}

	/**
	 * 測試看看指定值是否為API語言以及頁面標題或者頁面。
	 * 
	 * @param value
	 *            value to test. 要測試的值。
	 * @param {Boolean|String}[type]
	 *            test type: true('simple'), 'language', 'URL'
	 * @param {Boolean|String}[ignore_api]
	 *            ignore API, 'set': set API
	 * 
	 * @returns {Boolean}value 為 [ {String}API_URL/language, {String}title or
	 *          {Object}page_data ]
	 */
	function is_api_and_title(value, type, ignore_api) {
		// console.trace(value);

		if (!Array.isArray(value) || value.length !== 2
		//
		|| get_page_content.is_page_data(value[0])) {
			// 若有必要設定，應使用 normalize_title_parameter(title, options)。
			// 此時不能改變傳入之 value 本身，亦不能僅測試是否有 API_URL。
			return false;
		}

		if (type === true) {
			// type === true: simple test, do not test more.
			return true;
		}

		var title = value[1];

		// test title: {String}title or {Object}page_data or {Array}titles
		if (!title || typeof title !== 'string'
		// value[1] 為 titles (page list)。
		&& !Array.isArray(title)
		// 為了預防輸入的是問題頁面。
		&& !get_page_content.is_page_data(title)
		// 處理 is_id。
		&& (!(title > 0)
		// 注意：這情況下即使是{Natural}page_id 也會pass!
		|| typeof ignore_api !== 'object' || !ignore_api.is_id)) {
			library_namespace.debug('輸入的是問題頁面title: ' + title, 2,
					'is_api_and_title');
			return false;
		}

		var API_URL = value[0];

		// test API_URL: {String}API_URL/language
		if (!API_URL) {
			if (typeof ignore_api === 'object') {
				library_namespace.debug('嘗試從 options[KEY_SESSION] 取得 API_URL。',
						2, 'is_api_and_title');
				// console.log(ignore_api);
				// console.log(API_URL_of_options(ignore_api));

				// ignore_api 當作原函數之 options。
				API_URL = API_URL_of_options(ignore_api);
				if (API_URL) {
					value[0] = API_URL;
				}
				// 接下來繼續檢查 API_URL。
			} else {
				return !!ignore_api;
			}
		}

		if (typeof API_URL !== 'string') {
			// 若是未設定 action[0]，則將在wiki_API.query()補設定。
			// 因此若為 undefined || null，此處先不回傳錯誤。
			return !API_URL;
		}

		// for property = [ {String}language, {String}title or {Array}titles ]
		if (type === 'language') {
			return PATTERN_PROJECT_CODE_i.test(API_URL);
		}

		// 處理 [ {String}API_URL/language, {String}title or {Object}page_data ]
		var metched = PATTERN_URL_prefix.test(API_URL);
		if (type === 'URL') {
			return metched;
		}

		// for key = [ {String}language, {String}title or {Array}titles ]
		// for id = [ {String}language/site, {String}title ]
		return metched || PATTERN_PROJECT_CODE_i.test(API_URL);
	}

	/**
	 * 規範化 title_parameter
	 * 
	 * setup [ {String}API_URL, title ]
	 * 
	 * @param {String}title
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * @see api_URL
	 */
	function normalize_title_parameter(title, options) {
		var action = is_api_and_title(title, true)
		// 不改變原 title。
		? title.clone() : [ , title ];
		if (!is_api_and_title(action, false, options)) {
			library_namespace.warn(
			//
			'normalize_title_parameter: Invalid title! '
					+ get_page_title_link(title));
			return;
		}

		// 處理 [ {String}API_URL, title ]
		action[1] = wiki_API.query.title_param(action[1], true, options
				&& options.is_id);

		if (options && options.redirects) {
			// 毋須 '&redirects=1'
			action[1] += '&redirects';
		}

		return action;
	}

	/**
	 * append additional parameters of MediaWiki API.
	 * 
	 * @param {Array}action
	 * @param {Object}options
	 *            附加參數/設定選擇性/特殊功能與選項
	 * @inner
	 */
	function add_parameters(action, options) {
		if (!options.parameters) {
			return;
		}

		if (typeof options.parameters === 'string') {
			action[1] += '&' + options.parameters;
		} else if (library_namespace.is_Object(options.parameters)) {
			var parameters = Object.create(null);
			// TODO: 篩選掉指定為false的
			action[1] += '&' + get_URL.parameters_to_String(options.parameters);
		} else {
			library_namespace.debug('無法處理之 options.parameters: ['
					+ options.parameters + ']', 1, 'add_parameters');
		}
	}

	// --------------------------------------------------------------------------------------------

	var default_site_configurations = {

	};

	// --------------------------------------------------------------------------------------------
	// 工具函數。

	// https://phabricator.wikimedia.org/rOPUP558bcc29adc3dd7dfebbc66c1bf88a54a8b09535#3ce6dc61
	// server:
	// (wikipedia|wikibooks|wikinews|wikiquote|wikisource|wikiversity|wikivoyage|wikidata|wikimediafoundation|wiktionary|mediawiki)

	// e.g., [[s:]], [[zh-classical:]], [[zh-min-nan:]], [[test2:]],
	// [[metawikipedia:]], [[betawikiversity:]]
	// @see [[m:Help:Interwiki linking#Project titles and shortcuts]],
	// [[:zh:Help:跨语言链接#出現在正文中的連結]]
	// https://www.wikidata.org/w/api.php?action=help&modules=wbsearchentities
	// 警告: 應配合 get_namespace.pattern 排除 'Talk', 'User', 'Help', 'File', ...
	var PATTERN_PROJECT_CODE = /^[a-z][a-z\d\-]{0,14}$/,
	// 須亦能匹配 site key:
	// https://www.wikidata.org/w/api.php?action=help&modules=wbgetentities
	PATTERN_PROJECT_CODE_i = new RegExp(PATTERN_PROJECT_CODE.source, 'i');

	/**
	 * Wikimedia projects 的 URL match pattern 匹配模式。
	 * 
	 * matched: [ 0: protocol + host name, 1: protocol, 2: host name,<br />
	 * 3: 第一 domain name (e.g., language code / project),<br />
	 * 4: 第二 domain name (e.g., family: 'wikipedia') ]
	 * 
	 * @type {RegExp}
	 * 
	 * @see PATTERN_PROJECT_CODE
	 * @see PATTERN_URL_GLOBAL, PATTERN_URL_WITH_PROTOCOL_GLOBAL,
	 *      PATTERN_URL_prefix, PATTERN_WIKI_URL, PATTERN_wiki_project_URL,
	 *      PATTERN_external_link_global
	 */
	var PATTERN_wiki_project_URL = /^(https?:)?(?:\/\/)?(([a-z][a-z\d\-]{0,14})\.([a-z]+)+(?:\.[a-z]+)+)/i;

	/**
	 * Get the API URL of specified project.
	 * 
	 * project = language_code.family
	 * 
	 * @param {String}project
	 *            wiki project, domain or language. 指定維基百科語言/姊妹計劃<br />
	 *            e.g., 'en', 'en.wikisource'.
	 * 
	 * @returns {String}API URL
	 * 
	 * @see https://en.wikipedia.org/wiki/Wikipedia:Wikimedia_sister_projects
	 *      TODO:
	 *      https://zh.wikipedia.org/wiki/Wikipedia:%E5%A7%8A%E5%A6%B9%E8%AE%A1%E5%88%92#.E9.93.BE.E6.8E.A5.E5.9E.8B
	 */
	function api_URL(project) {
		if (!project) {
			return wiki_API.API_URL;
		}

		project = String(project);
		var lower_case = project.toLowerCase();
		if (lower_case in api_URL.alias) {
			project = api_URL.alias[lower_case];
		}
		library_namespace.debug('project: ' + project, 3, 'api_URL');
		// PATTERN_PROJECT_CODE_i.test(undefined) === true
		if (PATTERN_PROJECT_CODE_i.test(project)) {
			if (lower_case in api_URL.wikimedia) {
				project += '.wikimedia';
			} else if (lower_case in api_URL.family) {
				// (default_language || 'www') + '.' + project
				project = default_language + '.' + project;
			} else if (/wik/i.test(project)) {
				// e.g., 'mediawiki' → 'www.mediawiki'
				// e.g., 'wikidata' → 'www.wikidata'
				project = 'www.' + project;
			} else {
				// e.g., 'en' → 'en.wikipedia' ({{SERVERNAME}})
				// e.g., 'zh-yue' → 'zh-yue.wikipedia', 'zh-classical'
				// e.g., 'test2' → 'test2.wikipedia' ({{SERVERNAME}})
				project += '.wikipedia';
			}
		}
		// @see PATTERN_PROJECT_CODE
		if (/^[a-z][a-z\d\-]{0,14}\.[a-z]+$/i.test(project)) {
			// e.g., 'en.wikisource', 'en.wiktionary'
			project += '.org';
		}

		var matched = project.match(PATTERN_wiki_project_URL);
		if (matched) {
			// 先測試是否為自訂 API。
			return /\.php$/i.test(project) ? project
			// e.g., 'http://zh.wikipedia.org/'
			// e.g., 'https://www.mediawiki.org/w/api.php'
			// e.g., 'https://www.mediawiki.org/wiki/'
			: (matched[1] || api_URL.default_protocol || 'https:') + '//'
					+ matched[2] + '/w/api.php';
		}

		library_namespace.error('api_URL: Unknown project: [' + project
				+ ']! Using default API URL.');
		return wiki_API.API_URL;
	}

	// the key MUST in lower case!
	// @see https://www.wikimedia.org/
	api_URL.wikimedia = {
		meta : true,
		commons : true,
		species : true,
		incubator : true,

		// mul : true,
		phabricator : true,
		wikitech : true,
		// https://quarry.wmflabs.org/
		quarry : true,
		releases : true
	}
	// shortcut, namespace aliases.
	// the key MUST in lower case!
	// @see [[m:Help:Interwiki linking#Project titles and shortcuts]],
	// [[mw:Manual:InitialiseSettings.php]]
	// https://noc.wikimedia.org/conf/highlight.php?file=InitialiseSettings.php
	// [[:zh:Help:跨语言链接#出現在正文中的連結]]
	api_URL.alias = {
		// project with language prefix
		// project: language.*.org
		w : 'wikipedia',
		n : 'wikinews',
		// 維基教科書
		b : 'wikibooks',
		q : 'wikiquote',
		s : 'wikisource',
		// 維基學院
		v : 'wikiversity',
		voy : 'wikivoyage',
		wikt : 'wiktionary',

		// project: *.wikimedia.org
		m : 'meta',
		// 這一項會自動判別語言。
		metawikipedia : 'meta',
		c : 'commons',
		wikispecies : 'species',
		phab : 'phabricator',
		download : 'releases',

		// project: www.*.org
		d : 'wikidata',
		mw : 'mediawiki',
		wmf : 'wikimedia',

		betawikiversity : 'beta.wikiversity'
	};
	// families must with language prefix
	// the key MUST in lower case!
	api_URL.family = 'wikipedia|wikibooks|wikinews|wikiquote|wikisource|wikiversity|wikivoyage|wiktionary'
			.split('|').to_hash();

	api_URL.shortcut_of_project = Object.create(null);
	Object.keys(api_URL.alias).forEach(function(shortcut) {
		api_URL.shortcut_of_project[api_URL.alias[shortcut]] = shortcut;
	});

	/**
	 * setup API URL.
	 * 
	 * @param {wiki_API}session
	 *            正作業中之 wiki_API instance。
	 * @param {String}[API_URL]
	 *            language code or API URL of Wikidata
	 * 
	 * @inner
	 */
	function setup_API_URL(session, API_URL) {
		library_namespace.debug('API_URL: ' + API_URL + ', default_language: '
				+ default_language, 3, 'setup_API_URL');
		// console.log(session);
		// console.trace(default_language);
		if (API_URL === true) {
			// force to login.
			API_URL = session.API_URL || wiki_API.API_URL;
		}

		if (API_URL && typeof API_URL === 'string'
		// && is_wiki_API(session)
		) {
			session.API_URL = api_URL(API_URL);
			// is data session. e.g., "test.wikidata.org"
			session.is_wikidata = /\.wikidata\./i.test(API_URL);
			// remove cache
			delete session.last_page;
			delete session.last_data;
			// force to login again: see wiki_API.login
			// 據測試，不同 projects 間之 token 不能通用。
			delete session.token.csrftoken;
			delete session.token.lgtoken;
			// library_namespace.set_debug(6);

			if (library_namespace.platform.nodejs) {
				// 初始化 agent。
				// create and keep a new agent. 維持一個獨立的 agent。
				// 以不同 agent 應對不同 host。
				var agent = library_namespace.application.net
				//
				.Ajax.setup_node_net(session.API_URL);
				session.get_URL_options = {
					// start_time : Date.now(),
					// API_URL : session.API_URL,
					agent : agent
				};
				if (false) {
					// set User-Agent to use:
					// Special:ApiFeatureUsage&wpagent=CeJS script_name
					wiki.get_URL_options.headers['User-Agent'] = CeL.get_URL.default_user_agent;
				}
			}

		}

		// TODO: 這只是簡陋的判別方法。
		var matched = session.API_URL.match(PATTERN_wiki_project_URL);
		if (matched
				&& !/test|wiki/i.test(matched[3])
				&& ((matched = matched[4].toLowerCase()) in api_URL.shortcut_of_project)) {
			// e.g., "wikipedia"
			session.family = matched;
		}
	}

	// @see set_default_language(), language_to_site_name()
	function setup_API_language(session, language_code) {
		if (PATTERN_PROJECT_CODE_i.test(language_code)
		// 不包括 test2.wikipedia.org 之類。
		&& !/test|wiki/i.test(language_code)
		// 排除 'Talk', 'User', 'Help', 'File', ...
		&& !get_namespace.pattern.test(language_code)) {
			// [[m:List of Wikipedias]]
			session.language
			// e.g., 'zh-classical', 'zh-yue', 'zh-min-nan', 'simple'
			= language_code = language_code.toLowerCase();
			// apply local lag interval rule.
			if (!(session.lag >= 0) && (language_code in wiki_API.query.lag)) {
				session.lag = wiki_API.query.lag[language_code];
				library_namespace.debug('Use interval ' + session.lag
						+ ' for language ' + language_code, 1,
						'setup_API_language');
			}
		}
	}

	// ------------------------------------------------------------------------

	/**
	 * get NO of namespace
	 * 
	 * @param {String|Integer}namespace
	 *            namespace
	 * 
	 * @returns {Integer|String|Undefined}namespace NO.
	 */
	function get_namespace(namespace, namespace_hash) {
		if (namespace == Math.floor(namespace)) {
			// {Integer}namespace
			return namespace;
		}
		namespace_hash = namespace_hash || get_namespace.hash;

		if (typeof namespace === 'string') {
			var list = [];
			namespace.replace(/[_\s]+/g, '_').toLowerCase()
			// for ',Template,Category', ';Template;Category',
			// '|Template|Category'
			// https://www.mediawiki.org/w/api.php?action=help&modules=main#main.2Fdatatypes
			.split(/(?:[,;|\u001F]|%7C|%1F)/).forEach(function(n) {
				// get namespace only. e.g., 'wikipedia:sandbox' → 'wikipedia'
				var _n = n.replace(/:.*$/, '').trim();
				if (!_n) {
					// _n === ''
					list.push(0);
					return;
				}
				if (!isNaN(_n)) {
					// {Integer}_n
					list.push(_n);
					return;
				}
				if (_n in namespace_hash) {
					list.push(namespace_hash[_n]);
					return;
				}
				library_namespace.warn('get_namespace: Invalid namespace: ['
				//
				+ n + '] @ namespace list ' + namespace);
			});
			if (list.length === 0) {
				return undefined;
			}
			// list.sort().unique_sorted().join('|');
			list = list.unique();
			return list.length === 1 ? list[0] : list.join('|');
		}

		if (namespace !== undefined) {
			library_namespace.warn('get_namespace: Invalid namespace: ['
					+ namespace + ']');
		}
		return undefined;
	}

	/**
	 * The namespace number of the page. 列舉型別 (enumeration)
	 * 
	 * CeL.wiki.namespace.hash
	 * 
	 * {{NAMESPACENUMBER:{{FULLPAGENAME}}}}
	 * 
	 * @type {Object}
	 * 
	 * @see https://en.wikipedia.org/wiki/Wikipedia:Namespace
	 */
	get_namespace.hash = {
		// Virtual namespaces
		media : -2,
		special : -1,
		// 0: (Main/Article) main namespace 主要(條目內容/內文)命名空間/識別領域
		// 條目 entry 文章 article: ns = 0, 頁面 page: ns = any. 章節/段落 section
		'' : 0,
		main : 0,
		// 討論對話頁面
		talk : 1,
		// 使用者頁面
		user : 2,
		user_talk : 3,
		// the project namespace for matters about the project
		// Varies between wikis
		project : 4,
		wikipedia : 4,
		// https://en.wikinews.org/wiki/Help:Namespace
		wikinews : 4,
		// Varies between wikis
		project_talk : 5,
		wikipedia_talk : 5,
		// image
		file : 6,
		file_talk : 7,
		// [[MediaWiki:title]]
		mediawiki : 8,
		mediawiki_talk : 9,
		// 模板
		template : 10,
		template_talk : 11,
		help : 12,
		help_talk : 13,
		category : 14,
		category_talk : 15,
		// 主題/主題首頁
		portal : 100,
		// 主題討論
		portal_talk : 101,
		book : 108,
		book_talk : 109,
		draft : 118,
		draft_talk : 119,
		education_program : 446,
		education_program_talk : 447,
		timedtext : 710,
		timedtext_talk : 711,
		// 模块 模塊 模組
		module : 828,
		module_talk : 829,
		// 話題
		topic : 2600
	};

	get_namespace.name_of_NO = [];

	/**
	 * build `get_namespace.pattern`
	 * 
	 * @inner
	 */
	function generate_namespace_pattern(namespace_hash, name_of_NO) {
		var source = [];
		for ( var namespace in namespace_hash) {
			name_of_NO[namespace_hash[namespace]] = namespace;
			if (namespace)
				source.push(namespace);
		}

		// return pattern
		// [ , namespace, title ]
		return new RegExp('^(' + source.join('|').replace(/_/g, '[ _]')
				+ '):(.+)$', 'i');
	}
	get_namespace.pattern = generate_namespace_pattern(get_namespace.hash,
			get_namespace.name_of_NO);
	// console.log(get_namespace.pattern);

	/**
	 * remove namespace part of the title.
	 * 
	 * @param {String}title
	 *            page title 頁面標題。
	 * 
	 * @returns {String}title without namespace
	 */
	function remove_namespace(title) {
		if (typeof title !== 'string') {
			library_namespace.debug(title, 5, 'remove_namespace');
			if (get_page_content.is_page_data(title)) {
				title = title.title;
				// assert: now title is string.
			} else
				return title;
		}
		var matched = title.match(get_namespace.pattern);
		library_namespace.debug('Test ' + get_page_title_link(title)
				+ ', get [' + matched + '] using pattern '
				+ get_namespace.pattern, 4, 'remove_namespace');
		if (matched)
			return (matched ? matched[2] : title).trim();
	}

	function is_talk_namespace(namespace) {
		var n;
		if (typeof namespace === 'string') {
			// treat ((namespace)) as page title
			// get namespace only. e.g., 'wikipedia:sandbox' → 'wikipedia'
			namespace = namespace.replace(/:.*$/, '');
			if (isNaN(namespace) && !/^(?:[a-z _]+[_ ])?talk$/i.test(namespace))
				return false;
		}

		if (typeof namespace === 'number' || namespace > 0) {
			return namespace % 2 === 1;
		}

		n = get_namespace.name_of_NO[get_namespace(namespace)];
		// {String|Undefined}n
		return n
		// ((namespace)) is valid namespace,
		// {String}n is this normalized namespace
		&& n.endsWith('talk');
	}

	// ------------------------------------------------------------------------

	// wikitext to plain text
	// CeL.wiki.plain_text(wikitext)
	// @seealso function get_label(html) @ work_crawler.js
	function wikitext_to_plain_text(wikitext) {
		if (!wikitext || !(wikitext = wikitext.trim())) {
			// 一般 template 中之 parameter 常有設定空值的狀況，因此首先篩選以加快速度。
			return wikitext;
		}
		// TODO: "《茶花女》维基百科词条'''(法语)'''"
		wikitext = wikitext
		// 去除註解 comments。
		// e.g., "親会社<!-- リダイレクト先の「[[子会社]]」は、[[:en:Subsidiary]] とリンク -->"
		// "ロイ・トーマス<!-- 曖昧さ回避ページ -->"
		.replace(/<\!--[\s\S]*?-->/g, '')
		// 沒先處理的話，也會去除 <br />
		.replace(/<br(?:\s[^<>]*)?>/ig, '\n').replace(/<\/?[a-z][^>]*>/g, '')
		// e.g., "{{En icon}}"
		.replace(/{{[a-z\s]+}}/ig, '')
		// e.g., "[[link]]" → "link"
		// 警告：應處理 "[[ [[link]] ]]" → "[[ link ]]" 之特殊情況
		// 警告：應處理 "[[text | [[ link ]] ]]", "[[ link | a[1] ]]" 之特殊情況
		.replace(
				PATTERN_wikilink_global,
				function(all_link, page_and_section, page_name, section_title,
						displayed_text) {
					return displayed_text || page_and_section;
				})
		// e.g., "ABC (英文)" → "ABC "
		// e.g., "ABC （英文）" → "ABC "
		.replace(/[(（][英中日德法西義韓諺俄独原][語语國国]?文?[名字]?[）)]/g, '')
		// e.g., "'''''title'''''" → " title "
		// .remove_head_tail(): function remove_head_tail() @ CeL.data.native
		.remove_head_tail("'''", 0, ' ').remove_head_tail("''", 0, ' ')
		// 有時因為原先的文本有誤，還是會有 ''' 之類的東西留下來。
		.replace(/'{2,}/g, ' ').trim()
		// 此處之 space 應為中間之空白。
		.replace(/\s{2,}/g, function(space) {
			// trim tail
			return space.replace(/[^\n]{2,}/g, ' ')
			// 避免連\n都被刪掉。
			.replace(/[^\n]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
		}).replace(/[(（] /g, '(').replace(/ [）)]/g, ')');

		return wikitext;
	}

	// ------------------------------------------------------------------------
	// 創建 match pattern 相關函數。

	/**
	 * 將第一個字母轉成大寫。<br />
	 * 因為 wiki 僅僅將首字母大寫，中間的字不會被改變，因此不採用 toTitleCase() @ CeL.data.native。
	 * 
	 * 注意: 您實際需要的可能是 normalize_page_name()
	 * 
	 * cf. {{lcfirst:}}
	 * 
	 * @param {String}words
	 *            要轉換的文字。
	 * 
	 * @returns {String}轉換過的文字。
	 */
	function upper_case_initial(words) {
		words = String(words).trim();

		// method 1
		return words.charAt(0).toUpperCase() + words.slice(1);

		// method 2
		return words.replace(/^[^\s]/g, function(initial_char) {
			return initial_char.toUpperCase();
		});
	}

	wiki_API.upper_case_initial = upper_case_initial;

	/**
	 * 規範/正規化頁面名稱 page name。
	 * 
	 * TODO: 簡化。
	 * 
	 * 這種規範化只能通用於本 library 內。Wikipedia 並未硬性設限。<br />
	 * 依照
	 * [https://www.mediawiki.org/w/api.php?action=query&titles=Wikipedia_talk:Flow&prop=info]，
	 * "Wikipedia_talk:Flow" → "Wikipedia talk:Flow"<br />
	 * 亦即底線 "_" → space " "，首字母大寫。
	 * 
	 * @param {String}page_name
	 *            頁面名 valid page name。
	 * @param {Boolean}[use_underline]
	 *            採用 "_" 取代 " "。
	 * 
	 * @returns {String}規範後之頁面名稱。
	 * 
	 * @see [[Wikipedia:命名常規]]
	 * @see https://en.wikipedia.org/wiki/Wikipedia:Page_name#Technical_restrictions_and_limitations
	 */
	function normalize_page_name(page_name, use_underline) {
		if (!page_name || typeof page_name !== 'string')
			return page_name;

		page_name = page_name
		// 不採用 .trimEnd()：對於標題，無論前後加幾個"\u200E"(LEFT-TO-RIGHT MARK)都會被視為無物。
		// "\u200F" 亦不被視作 /\s/，但經測試會被 wiki 忽視。
		// tested: [[title]], {{title}}
		// @seealso [[w:en:Category:CS1 errors: invisible characters]]
		.replace(/[\s\u200B\u200E\u200F\u2060]+$/, '')
		// 只能允許出現頂多一個 ":"。
		.replace(
		// \u2060: word joiner (WJ). /^\s$/.test('\uFEFF')
		/^[\s\u200B\u200E\u200F\u2060]*(?::[\s\u200B\u200E\u200F\u2060]*)?/
		// 去除不可見字符 \p{Cf}，警告 \p{C}。
		, '')
		// 處理連續多個空白字元。長度相同的情況下，盡可能保留原貌。
		.replace(/([ _]){2,}/g, '$1');

		page_name = use_underline
		// ' ' → '_': 在 URL 上可更簡潔。
		? page_name.replace(/ /g, '_') : page_name.replace(/_/g, ' ');

		page_name = page_name.split(':');
		var has_language;

		page_name.some(function(section, index) {
			section = use_underline ? section.replace(/^[\s_]+/, '') : section
					.trimStart();
			if (index === page_name.length - 1
			// @see PATTERN_PROJECT_CODE
			|| !(use_underline ? /^[a-z][a-z\d\-_]{0,14}$/i
			//
			: /^[a-z][a-z\d\- ]{0,14}$/i).test(section.trimEnd())) {
				// page title: 將首個字母轉成大寫。
				page_name[index] = upper_case_initial(section);
				return true;
			}

			if ((use_underline ? section : section.replace(/ /g, '_'))
			//
			.trimEnd().toLowerCase() in get_namespace.hash) {
				// Wikipedia namespace
				section = section.trimEnd().toLowerCase();
				if (!use_underline) {
					section = section.replace(/_/g, ' ');
				}
				page_name[index] = upper_case_initial(section);

			} else if (has_language) {
				// page title: 將首個字母轉成大寫。
				page_name[index] = upper_case_initial(section);
				return true;

			} else {
				section = use_underline ? section.replace(/[\s_]+$/, '')
						: section.trimEnd();
				section = section.toLowerCase();
				if (section.length > 1) {
					// lang code
					has_language = true;
					if (use_underline) {
						section = section.replace(/_/g, '-');
					}
				}
				// else: e.g., [[m:Abc]]
				page_name[index] = section;
			}

		});

		return page_name.join(':');
	}

	// @see wiki_toString
	function normalize_name_pattern(file_name, add_group, remove_namespace) {
		if (get_page_content.is_page_data(file_name))
			file_name = file_name.title;
		if (!file_name)
			return file_name;

		if (typeof file_name === 'string' && file_name.includes('|'))
			file_name = file_name.split('|');

		if (Array.isArray(file_name)) {
			var files = [];
			file_name
					.forEach(function(name) {
						if (name = normalize_name_pattern(name, false,
								remove_namespace))
							files.push(name);
					});
			return (add_group ? '(' : '(?:') + files.join('|') + ')';
		}

		if (remove_namespace) {
			// 去除 namespace。e.g., Template:
			// console.log('去除 namespace: [' + file_name + ']');
			file_name = file_name.replace(/^[^:]+:\s*/, '');
		}

		file_name =
		// wiki file 首字不區分大小寫。
		// the case of the first letter is not significant.
		library_namespace.ignore_first_char_case(
		// escape 特殊字元。注意:照理說來檔案或模板名不應該具有特殊字元！
		library_namespace.to_RegExp_pattern(String(file_name).trim()))
		// 不區分空白與底線。
		.replace(/[ _]/g, '[ _]');

		if (add_group)
			file_name = '(' + file_name + ')';

		return file_name;
	}

	wiki_API.normalize_name_pattern = normalize_name_pattern;

	/**
	 * 創建匹配 [[File:file_name]] 之 pattern。
	 * 
	 * @param {String}file_name
	 *            file name.
	 * @param {String}flag
	 *            RegExp flag
	 * 
	 * @returns {RegExp} 能 match [[File:file_name]] 之 pattern。
	 */
	function file_pattern(file_name, flag) {
		return (file_name = normalize_name_pattern(file_name, true))
				//
				&& new RegExp(file_pattern.source.replace(/name/, file_name),
						flag || 'g');
	}

	// [[維基百科:名字空間#文件名字空间]]
	// [[Media:image.png]]：產生一個指向檔案本身的連結
	// https://github.com/dbpedia/extraction-framework/blob/master/core/src/main/settings/zhwiki-configuration.xml
	// https://github.com/dbpedia/extraction-framework/blob/master/core/src/main/scala/org/dbpedia/extraction/wikiparser/impl/wikipedia/Namespaces.scala
	//
	// Fichier:
	// https://fr.wikipedia.org/wiki/Aide:Ins%C3%A9rer_une_image_(wikicode,_avanc%C3%A9)
	//
	// https://zh.wikipedia.org/wiki/Wikipedia:互助客栈/其他#增设空间“U：”、“UT：”作为“User：”、“User_talk：”的Alias
	// 提議增加F、FT指向File、File Talk
	/** {RegExp}檔案的匹配模式 for parser。 */
	var PATTERN_file_prefix = 'File|Fichier|檔案|档案|文件|ファイル|Image|圖像|图像|画像|Media|媒[體体](?:文件)?';

	file_pattern.source =
	// 不允許 [\s\n]，僅允許 ' '。
	// [ ':', file name, 接續 ]
	/\[\[ *(?:(:) *)?(?:Tag) *: *name *(\||\]\])/
	// [[ :File:name]] === [[File:name]]
	.source.replace('Tag', library_namespace
			.ignore_case_pattern(PATTERN_file_prefix));

	// [ all, file name ]
	PATTERN_file_prefix = new RegExp('^ *(?:: *)?(?:' + PATTERN_file_prefix
			+ ') *: *([^\\[\\]|#]+)', 'i');

	// "Category" 本身可不分大小寫。
	// 分類名稱重複時，排序索引以後出現者為主。
	var
	// [ all_category_text, category_name, sort_order, post_space ]
	PATTERN_category = /\[\[ *(?:Category|分類|分类|カテゴリ) *: *([^\[\]\|{}\n]+)(?:\s*\|\s*([^\[\]\|�]*))?\]\](\s*\n?)/ig,
	/** {RegExp}分類的匹配模式 for parser。 [all,name] */
	PATTERN_category_prefix = /^ *(?:Category|分類|分类|カテゴリ) *: *([^\[\]\|{}\n�]+)/i;

	// ------------------------------------------------------------------------

	/**
	 * 將 page data list 轉為 hash。<br />
	 * cf. Array.prototype.to_hash @ data.native
	 * 
	 * @param {Array}page_data_list
	 *            list of page_data.
	 * @param {Boolean}use_id
	 *            use page id instead of title.
	 * 
	 * @returns {Object}title/id hash
	 */
	function list_to_hash(page_data_list, use_id) {
		var hash = Object.create(null);
		page_data_list.forEach(use_id ? function(page_data) {
			// = true
			hash[page_data.pageid] = page_data;
		} : function(page_data) {
			// = true
			hash[page_data.title] = page_data;
		});
		return hash;
	}

	/**
	 * 去掉 page data list 中重複的 items。<br />
	 * cf. Array.prototype.unique @ data.native
	 * 
	 * @param {Array}page_data_list
	 *            list of page_data.
	 * 
	 * @returns {Array}unique list
	 */
	function unique_list(page_data_list) {
		var array = [],
		// 以 hash 純量 index 加速判別是否重複。
		hash = Object.create(null);

		page_data_list.forEach(function(page_data) {
			var key = typeof page_data == 'string' ? page_data
					: page_data.title;
			if (!(key in hash)) {
				hash[key] = null;
				// 能確保順序不變。
				array.push(page_data);
			}
		});

		return array;
	}

	function to_template_wikitext_toString_slice(separator) {
		return this.join(separator || '|');
	}

	function to_template_wikitext_toString(separator) {
		return '{{' + this.join(separator || '|') + '}}';
	}

	/**
	 * escape wikitext control characters of text, to plain wikitext.<br />
	 * escape 掉會造成問題之 characters。
	 * 
	 * @example <code>
	CeL.wiki.escape_text(text);
	 * </code>
	 * 
	 * TODO: "&"
	 * 
	 * @param {String}text
	 *            包含有問題字元的文字字串。
	 * @param {Boolean}is_uri
	 *            輸出為 URI 或 URL。
	 * @returns {String}plain wikitext
	 * 
	 * @see function section_link_escape(text, is_uri)
	 * @see [[w:en:Help:Special characters]]
	 */
	function escape_text(text, is_uri) {
		function escape_character(character) {
			var code = character.charCodeAt(0);
			if (is_uri) {
				return '%' + code.toString(16);
			}
			return '&#' + code + ';';
		}

		return text
		// 經測試 anchor 亦不可包含[{}\[\]\n�]。
		.replace(/[\|{}\[\]<>�]/g, escape_character)
		// escape "''", "'''"
		.replace(/''/g, "'" + escape_character("'"))
		// escape [[w:en:Help:Magic links]]
		.replace(/__/g, "_" + escape_character("_"))
		// escape signing
		.replace(/~~~/g, "~~" + escape_character("~"))
		// escape list, section title
		.replace(/\n([*#;:=\n])/g, function(all, character) {
			return "\n" + escape_character(character);
		});
	}

	// 2017/1/18 18:46:2
	// TODO: escape special characters
	function to_template_wikitext(parameters, options) {
		var keys = Object.keys(parameters), template_name, is_continue = true;
		if (options) {
			if (typeof options === 'string') {
				template_name = options;
			} else {
				template_name = options.name;
			}
		}

		var wikitext = keys.map(function(key) {
			if (is_continue
			//
			&& (is_continue = library_namespace.is_digits(key))) {
				return parameters[key];
			}
			return key + '=' + parameters[key];
		});
		if (template_name) {
			wikitext.unshift(template_name);
			wikitext.toString = to_template_wikitext_toString;
		} else {
			wikitext.toString = to_template_wikitext_toString_slice;
		}
		return options && options.to_Array ? wikitext
		//
		: wikitext.toString(options && options.separator);
	}

	// --------------------------------------------------------------------------------------------
	// parse wikitext.

	/**
	 * 不包含可 parse 之要素，不包含 text 之 type。<br />
	 * 不應包含 section title，因可能有 "==[[]]==" 的情況。
	 * 
	 * @type {Object}
	 */
	var atom_type = {
		namespace : true,
		// https://phabricator.wikimedia.org/T173889
		page_title : true,
		// external_link : true,
		url : true,
		style : true,
		tag_single : true,
		comment : true
	};

	// tree level
	var KEY_DEPTH = 'depth';

	/**
	 * 設定 token 為指定 type。將 token 轉為指定 type。
	 * 
	 * @param {Array}token
	 *            parse_wikitext() 解析 wikitext 所得之，以 {Array} 組成之結構。
	 * @param {String}type
	 *            欲指定之類型。 e.g., 'transclusion'.
	 * 
	 * @returns {Array}token
	 * 
	 * @see wiki_toString
	 */
	function set_wiki_type(token, type, parent) {
		// console.trace(token);
		if (typeof token === 'string') {
			token = [ token ];
		} else if (!Array.isArray(token)) {
			library_namespace.warn('set_wiki_type: The token is not Array!');
		} else if (token.type && token.type !== 'plain') {
			// 預防token本來就已經有設定類型。
			token = [ token ];
		}
		// assert: Array.isArray(token)
		token.type = type;
		if (type in atom_type) {
			token.is_atom = true;
		}
		// check
		if (false && !wiki_toString[type]) {
			throw new Error('.toString() not exists for type [' + type + ']!');
		}

		token.toString = wiki_toString[type];
		// Object.defineProperty(token, 'toString', wiki_toString[type]);

		if (false) {
			var depth;
			if (parent >= 0) {
				// 當作直接輸入 parent depth。
				depth = parent + 1;
			} else if (parent && parent[KEY_DEPTH] >= 0) {
				depth = parent[KEY_DEPTH] + 1;
			}
			// root 的 depth 為 (undefined|0)===0
			token[KEY_DEPTH] = depth | 0;
		}

		return token;
	}

	/*
	 * should use: class Wiki_page extends Array { }
	 * http://www.2ality.com/2015/02/es6-classes-final.html
	 */

	/**
	 * constructor (建構子) of {wiki page parser}. wikitext 語法分析程式, wikitext 語法分析器.
	 * 
	 * TODO:<code>

	should use:
	parsetree of https://www.mediawiki.org/w/api.php?action=help&modules=expandtemplates

	class Wiki_page extends Array { }
	http://www.2ality.com/2015/02/es6-classes-final.html

	 * </code>
	 * 
	 * @param {String|Object}wikitext
	 *            wikitext / page data to parse
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * 
	 * @returns {wiki page parser}
	 */
	function page_parser(wikitext, options) {
		if (typeof wikitext === 'string') {
			wikitext = [ wikitext ];
		} else if (get_page_content.is_page_data(wikitext)) {
			// 可以用 "CeL.wiki.parser(page_data).parse();" 來設置 parser。
			var page_data = wikitext;
			if (!page_data.parsed
			// re-parse
			|| options && (options.reparse || options.wikitext)) {
				page_data.parsed = wikitext = [ options && options.wikitext
						|| get_page_content(page_data, options || 0) ];
				wikitext.page = page_data;
			} else {
				return page_data.parsed;
			}
		} else if (!wikitext) {
			library_namespace.warn('page_parser: No wikitext specified.');
			wikitext = [];
		} else {
			throw new Error('page_parser: Unknown wikitext: [' + wikitext
					+ '].');
		}

		if (library_namespace.is_Object(options)) {
			wikitext.options = options;
		}
		// copy prototype methods
		Object.assign(wikitext, page_parser.parser_prototype);
		set_wiki_type(wikitext, 'plain');
		return wikitext;
	}

	/** {Object}prototype of {wiki page parser}, CeL.wiki.parser.parser_prototype */
	page_parser.parser_prototype = {
		each_section : for_each_section,

		// for_token
		// CeL.wiki.parser.parser_prototype.each.call(token_list,...)
		// 在執行 .each() 之前，應該先執行 .parse()。
		each : for_each_token,
		parse : parse_page,
		parse_references : parse_references,
		insert_before : insert_before
	};

	/** {Object}alias name of type */
	page_parser.type_alias = {
		wikilink : 'link',
		weblink : 'external_link',
		row : 'table_row',
		tr : 'table_row',
		// table_cell 包含 th + td，須自行判別！
		th : 'table_cell',
		td : 'table_cell',
		template : 'transclusion',
		// wikitext, 'text': plain text
		text : 'plain',
		'' : 'plain'
	};

	// CeL.wiki.parser.footer_order()
	page_parser.footer_order = footer_order;

	// ------------------------------------------

	if (false) {
		wikitext = 'a\n[[File:f.jpg|thumb|d]]\nb';
		CeL.wiki.parser(wikitext).parse().each('namespace',
				function(token, index, parent) {
					console.log([ index, token, parent ]);
				}, true).toString();
	}

	/**
	 * 對所有指定類型 type，皆執行特定作業 processor。
	 * 
	 * TODO: 可中途跳出。
	 * 
	 * @param {String}[type]
	 *            欲搜尋之類型。 e.g., 'template'. see ((wiki_toString)).<br />
	 *            未指定: 處理所有節點。
	 * @param {Function}processor
	 *            執行特定作業: processor({Array|String|undefined}inside token list,
	 *            {ℕ⁰:Natural+0}index of token, {Array}parent of token,
	 *            {ℕ⁰:Natural+0}depth) {<br />
	 *            return {String}wikitext or {Object}element;}
	 * @param {Boolean}[modify_this]
	 *            若 processor 的回傳值為{String}wikitext，則將指定類型節點替換/replace作此回傳值。
	 * @param {Natural}[max_depth]
	 *            最大深度。
	 * 
	 * @returns {wiki page parser}
	 * 
	 * @see page_parser.type_alias
	 */
	function for_each_token(type, processor, modify_this, max_depth) {
		if (typeof type === 'function' && max_depth === undefined) {
			// for_each_token(processor, modify_this, max_depth)
			// shift arguments.
			max_depth = modify_this;
			modify_this = processor;
			processor = type;
			type = undefined;
		}

		var options;
		// for_each_token(type, processor, options)
		if (max_depth === undefined && typeof modify_this === 'object') {
			options = modify_this;
			modify_this = options.modify;
			max_depth = options.max_depth;
		} else {
			options = Object.create(null);
		}

		// console.log(options);

		if (typeof modify_this === 'number' && modify_this > 0
				&& max_depth === undefined) {
			// for_each_token(type, processor, max_depth)
			// shift arguments.
			max_depth = modify_this;
			modify_this = undefined;
		}

		// console.log('max_depth: ' + max_depth);

		if (type || type === '') {
			if (typeof type !== 'string') {
				library_namespace.warn(
				//
				'for_each_token: Invalid type specified! [' + type + ']');
				return this;
			}
			// normalize type
			// assert: typeof type === 'string'
			type = type.toLowerCase().replace(/\s/g, '_');
			if (type in page_parser.type_alias) {
				type = page_parser.type_alias[type];
			}
		}

		// options.slice: range index: {Number}start index
		// || {Array}[ {Number}start index, {Number}end index ]
		var slice = options.slice, exit;
		// console.log(slice);
		if (slice >= 0) {
			// 第一層 start from ((slice))
			slice = [ slice ];
		} else if (slice && (!Array.isArray(slice) || slice.length > 2)) {
			library_namespace.warn('for_each_token: Invalid slice: '
					+ JSON.stringify(slice));
			slice = undefined;
		}

		if (!this.parsed && typeof this.parse === 'function') {
			// 因為本函數為 CeL.wiki.parser(content) 最常使用者，
			// 因此放在這少一道 .parse() 工序。
			this.parse();
		}

		// 遍歷 tokens
		function traversal_tokens(_this, depth) {
			function for_token(token, index) {
				if (false) {
					console.log('token depth ' + depth + '/' + max_depth
							+ (exit ? ' (exit)' : '') + ':');
					console.log(token);
				}
				if (exit) {
					// 直接跳出。
					return true;
				}

				if (!type
				// 'plain': 對所有 plain text 或尚未 parse 的 wikitext.，皆執行特定作業。
				|| type === (Array.isArray(token) ? token.type : 'plain')) {
					if (options.add_index && typeof token !== 'string') {
						// 假如需要自動設定 .parent, .index 則必須特別指定。
						// token.parent[token.index] === token
						// .index_of_parent
						token.index = index;
						token.parent = _this;
					}
					// get result. 須注意: 此 token 可能為 Array, string, undefined！
					// for_each_token(
					// token, token_index, parent_of_token, depth)
					var result = processor(token, index, _this, depth);
					// console.log(modify_this);
					// console.log(result);
					if (result === for_each_token.exit) {
						library_namespace.debug('Abort the operation', 3,
								'for_each_token');
						exit = true;
						return true;
					}
					if (modify_this) {
						// 小技巧: 可以用 return [ inner ].is_atom = true 來避免進一步的
						// parse 或者處理。
						if (typeof result === 'string') {
							// {String}wikitext to ( {Object}element or '' )
							result = parse_wikitext(result, null, []);
						}
						if (typeof result === 'string'
						//
						|| Array.isArray(result)) {
							// 將指定類型節點替換作此回傳值。
							_this[index] = token = result;
						}
					}
				} else if (options.add_index === 'all'
						&& typeof token !== 'string') {
					token.index = index;
					token.parent = _this;
				}

				// depth-first search (DFS) 向下層巡覽，再進一步處理。
				// Skip inner tokens, skip children.
				if (result !== for_each_token.skip_inner
				// is_atom: 不包含可 parse 之要素，不包含 text。
				&& Array.isArray(token) && !token.is_atom
				// comment 可以放在任何地方，因此能滲透至任一層。
				// 但這可能性已經在 parse_wikitext() 中偵測並去除。
				// && type !== 'comment'
				&& (!max_depth || depth + 1 < max_depth)) {
					traversal_tokens(token, depth + 1);
					if (exit) {
						// 直接跳出。
						return true;
					}
				}
			}

			if (slice && depth === 0) {
				// 若有 slice，則以更快的方法遍歷 tokens。
				// TODO: 可以設定多個範圍，而不是只有一個 range。
				for (var index = slice[0] | 0, boundary = slice[1] >= 0 ? Math
						.min(slice[1] | 0, _this.length) : _this.length; index < boundary; index++) {
					if (for_token(_this[index], index))
						break;
				}
			} else {
				// console.log(_this);
				_this.some(for_token);
			}
		}

		if (Array.isArray(this))
			traversal_tokens(this, 0);

		return this;
	}

	// 直接跳出。
	for_each_token.exit = [ 'for_each_token.exit: abort the operation' ];
	// Skip inner tokens, skip children.
	for_each_token.skip_inner = [ 'for_each_token.skip_inner: skip children' ];

	// 兩 token 都必須先有 .index, .parent!
	// token.parent[token.index] === token
	// @see options.add_index @ function for_each_token()
	// 注意: 這個交換純粹只操作於 page_data.parsed 上面，
	// 不會改變其他參照，例如 page_data.parsed.reference_list!
	// 通常一個頁面只能夠交換一次，交換兩次以上可能就會出現問題!
	function switch_token(token_1, token_2) {
		// console.log([ token_1, token_2 ]);
		token_1.parent[token_1.index] = token_2;
		token_2.parent[token_2.index] = token_1;

		var index_1 = token_1.index;
		token_1.index = token_2.index;
		token_2.index = index_1;

		var parent_1 = token_1.parent;
		token_1.parent = token_2.parent;
		token_2.parent = parent_1;
	}

	// ------------------------------------------------------------------------

	/**
	 * 快速取得 lead section / first section / 導入文 文字用。
	 * 
	 * @example <code>

	CeL.wiki.lead_text(content);

	 * </code>
	 * 
	 * @param {String}wikitext
	 *            wikitext to parse
	 * 
	 * @returns {String}lead section wikitext 文字
	 * 
	 * @see 文章的開頭部分[[WP:LEAD|導言章節]] (lead section, introduction),
	 *      [[en:Wikipedia:Hatnote]] 頂註
	 */
	function lead_text(wikitext) {
		var page_data;
		if (get_page_content.is_page_data(wikitext)) {
			page_data = wikitext;
			wikitext = get_page_content(page_data);
		}
		if (!wikitext || typeof wikitext !== 'string') {
			return wikitext;
		}

		var matched = wikitext.indexOf('\n=');
		if (matched >= 0) {
			wikitext = wikitext.slice(0, matched);
		}

		// match/去除一開始的維護模板/通知模板。
		// <s>[[File:file|[[link]]...]] 因為不容易除盡，放棄處理。</s>
		while (matched = wikitext.match(/^[\s\n]*({{|\[\[)/)) {
			// 注意: 此處的 {{ / [[ 可能為中間的 token，而非最前面的一個。但若是沒有中間的 token，則一定是第一個。
			matched = matched[1];
			// may use get_page_title_link()
			var index_end = wikitext.indexOf(matched === '{{' ? '}}' : ']]');
			if (index_end === NOT_FOUND) {
				library_namespace.debug('有問題的 wikitext，例如有首 "' + matched
						+ '" 無尾？ [' + wikitext + ']', 2, 'lead_text');
				break;
			}
			// 須預防 -{}- 之類 language conversion。
			var index_start = wikitext.lastIndexOf(matched, index_end);
			wikitext = wikitext.slice(0, index_start)
			// +2: '}}'.length, ']]'.length
			+ wikitext.slice(index_end + 2);
		}

		if (page_data) {
			page_data.lead_text = lead_text;
		}

		return wikitext.trim();
	}

	// ------------------------------------------

	/**
	 * 擷取出頁面簡介。
	 * 
	 * @example <code>

	CeL.wiki.extract_introduction(page_data).toString();

	 * </code>
	 * 
	 * @param {Array|Object}first_section
	 *            first section or page data
	 * @param {String}[title]
	 *            page title.
	 * 
	 * @returns {Undefined|Array} introduction object
	 * 
	 * @since 2019/4/10
	 */
	function extract_introduction(first_section, title) {
		var parsed;
		if (get_page_content.is_page_data(first_section)) {
			if (!title)
				title = get_page_title(first_section);
			parsed = page_parser(first_section).parse();
			parsed.each_section(function(section, index) {
				if (index === 0)
					first_section = section;
			});
		}
		if (!first_section)
			return;

		// --------------------------------------

		var introduction_section = [], representative_image, index = 0;
		if (parsed) {
			introduction_section.page = parsed.page;
			introduction_section.title = title;
			// free
			parsed = null;
		}
		introduction_section.toString = first_section.toString;

		// --------------------------------------

		for (; index < first_section.length; index++) {
			var token = first_section[index];
			if (token.type === 'file') {
				// {String}代表圖像。
				if (!representative_image) {
					representative_image = token;
				}
				continue;
			}

			if (token.type === 'transclusion') {
				if (token.name === 'NoteTA') {
					// preserve 轉換用詞
					// introduction_section.push(token);
					continue;
				}

				if (token.name === 'R') {
					// Skip reference
					continue;
				}

				// 抽取出代表圖像。
				if (!representative_image) {
					representative_image = token.parameters.image
							|| token.parameters.file
					// ||token.parameters['Image location']
					;
				}
				if (!representative_image) {
					token = token.toString();
					// console.log(token);
					var matched = token
							.match(/\|[^=]+=([^\|{}]+\.(?:jpg|png|svg|gif|bmp))[\s\n]*[\|}]/i);
					if (matched) {
						representative_image = matched[1];
					}
				}

				continue;
			}

			if (!token.toString().trim()) {
				continue;
			}

			if (token.type === 'bold' || token.type === 'plain'
					&& token.toString().includes(title)) {
				// title_piece
				introduction_section.title_token = token;
			}
			introduction_section.push(token);
			if (introduction_section.title_token)
				break;
		}

		// ------------------

		// 已經跳過導航模板。把首段餘下的其他內容全部納入簡介中。
		while (++index < first_section.length) {
			token = first_section[index];
			// remove {{Notetag}}, <ref>
			if (token.type === 'tag' && token.tag === 'ref'
					|| token.type === 'transclusion'
					&& token.name === 'Notetag')
				continue;
			introduction_section.push(token);
		}
		index = introduction_section.length;
		// trimEnd() 去頭去尾
		while (--index > 0) {
			if (introduction_section[index].toString().trim())
				break;
			introduction_section.pop();
		}

		// --------------------------------------

		// 首個段落不包含代表圖像。檢查其他段落以抽取出代表圖像。
		if (!representative_image) {
			parsed.each('file', function(token) {
				representative_image = token;
				return for_each_token.exit;
			});
		}

		// --------------------------------------

		if (typeof representative_image === 'string') {
			// assert: {String}representative_image

			// remove [[File:...]]
			representative_image = representative_image.replace(/^\[\[[^:]+:/i,
					'').replace(/\|[\s\S]*/, '').replace(/\]\]$/, '');
			representative_image = parse_wikitext('[[File:'
					+ get_page_title(representative_image) + ']]');
		}
		introduction_section.representative_image = representative_image;

		return introduction_section;
	}

	// ------------------------------------------

	// @inner
	function preprocess_section_link_token(token) {
		if (token.type === 'tag') {
			// token: [ tag_attributes, tag_inner ]
			if (token.tag === 'nowiki') {
				// escape characters inside <nowiki>
				return preprocess_section_link_token(token[1] ? token[1]
						.toString() : '');
			}

			// 容許一些特定標籤能夠顯示格式。以繼承原標題的粗體斜體和顏色等等格式。
			if (token.tag in {
				b : true,
				i : true,
				sub : true,
				sup : true,
				span : true
			}) {
				// reduce HTML tags. e.g., <b>, <sub>, <sup>, <span>
				token.tag_attributes = token.shift();
				token.original_type = token.type;
				token.type = 'plain';
				token.toString = wiki_toString[token.type];
				return token;
			}

			// reduce HTML tags. e.g., <ref>
			// console.log(token);
			var new_token = preprocess_section_link_tokens(token[1] || '');
			new_token.tag = token.tag;
			return new_token;
		}
		if ((token.type === 'file' || token.type === 'category')
				&& !token.is_link) {
			// 顯示時，TOC 中的圖片、分類會被消掉，圖片在內文中才會顯現。
			return '';
		}
		if (token.type === 'link' || token.type === 'category'
		// e.g., [[:File:file name.jpg]]
		|| token.type === 'file') {
			// escape wikilink
			// return displayed_text
			if (token.length > 2) {
				token = token.slice(2);
				token.type = 'plain';
				// @see wiki_toString.file, for token.length > 2
				token.toString = function() {
					return this.join('|')
				};
				token = preprocess_section_link_tokens(token);
			} else {
				// 去掉最前頭的 ":"。 @see wiki_toString
				token = token[0].toString().replace(/^ *:?/, '') + token[1];
			}
			// console.log(token);
			return token;
		}
		// 模板這個部分除了解析模板之外沒有好的方法。
		// 這邊僅處理常用模板。需要先保證這些模板存在，並且具有預期的功能。
		// TODO: [[Template:疑問]], [[Template:Block]]
		// 正式應該採用 parse 或 expandtemplates 解析出實際的 title，之後 callback。
		// https://www.mediawiki.org/w/api.php?action=help&modules=parse
		if (token.type === 'transclusion') {
			// template-linking templates: Tl, Tlx, Tls, T1, ...
			if (/^T[l1n][a-z]{0,3}[23]?$/.test(token.name)) {
				token.shift();
				return token;
			}
			// 警告: 在遇到標題包含模板時，因為不能解析連模板最後產出的結果，會產生錯誤結果。
			// TODO: 採用 parse 或 expandtemplates
			return token;
		}

		if (token.type === 'external_link') {
			// escape external link
			// console.log('>> ' + token);
			// console.log(token[1]);
			// console.log(preprocess_section_link_tokens(token[1]));
			if (token[1]) {
				return preprocess_section_link_tokens(token[1]);
			}
			// TODO: error: 用在[URL]無標題連結會失效。需要計算外部連結的序號。
			return token;
		}
		if (token.type === 'switch') {
			return '';
		}
		if (token.type === 'bold' || token.type === 'italic') {
			// 去除粗體與斜體。
			token.original_type = token.type;
			token.type = 'plain';
			token.toString = wiki_toString[token.type];
			return token;
		}
		if (typeof token === 'string') {
			// console.log('>> [' + index + '] ' + token);
			// console.log(parent);
			// TODO: use library_namespace.DOM.HTML_to_Unicode()
			token = token.replace(/&#(\d+);/g, function(all, code) {
				return String.fromCharCode(code);
			}).replace(/&#x([0-9a-f]+);/ig, function(all, code) {
				return String.fromCharCode(parseInt(code, 16));
			}).replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(
					/&amp;/g, '&');
			if (/[^\s]/.test(token)) {
				// 避免被進一步的處理，例如"&amp;amp;"。
				token = [ token ];
				token.is_atom = true;
				token.is_plain = true;
			}
			return token;
		}
		return token;
	}

	// @inner
	function preprocess_section_link_tokens(tokens) {
		if (Array.isArray(tokens) && tokens.type === 'plain') {
			// console.log('tokens:');
			// console.log(tokens);
			for_each_token.call(tokens, preprocess_section_link_token, true);
			return tokens;
		}

		return preprocess_section_link_token(tokens);
	}

	function section_link_escape(text, is_uri) {
		// escape wikitext control characters,
		// including language conversion -{}-
		if (true) {
			text = text.replace(
			// 盡可能減少字元的使用量，因此僅處理開頭，不處理結尾。
			// @see [[w:en:Help:Wikitext#External links]]
			is_uri ? /[\|{}\[\]<]/g
			// 為了容許一些特定標籤能夠顯示格式，"<>"已經在preprocess_section_link_token(),section_link()裡面處理過了。
			// display_text 在 "[[", "]]" 中，不可允許 "[]"
			: /[\|{}<>]/g && /[\|{\[\]]/g,
			// 經測試 anchor 亦不可包含[{}\[\]\n�]。
			function(character) {
				if (is_uri) {
					return '%' + character.charCodeAt(0).toString(16);
				}
				return '&#' + character.charCodeAt(0) + ';';
			}).replace(/[ \n]{2,}/g, ' ');
		} else {
			// 只處理特殊字元而不是採用encodeURIComponent()，這樣能夠保存中文字，使其不被編碼。
			text = encodeURIComponent(text);
		}

		return text;
	}

	// @inner
	// return [[維基連結]]
	// TODO: using external link to display "�"
	function section_link_toString(page_title, style) {
		var anchor = (this[1] || '').replace(/�/g, '?'),
		// 目前維基百科 link anchor, display_text 尚無法接受 REPLACEMENT CHARACTER U+FFFD
		// "�" 這個字元。
		display_text = (this[2] || '').replace(/�/g, '?');

		display_text = display_text ?
		//
		style ? '<span style="' + style + '">' + display_text + '</span>'
				: display_text : '';

		return get_page_title_link(
				(page_title || this[0] || '') + '#' + anchor, null,
				display_text);
		return '[[' + (page_title || this[0] || '') + '#' + anchor + '|'
				+ display_text + ']]';
	}

	// 用來保留 display_text 中的 language conversion -{}-，
	// 必須是標題裡面不會存在的字串，並且也不會被section_link_escape()轉換。
	var section_link_START_CONVERT = '\0\x01', section_link_END_CONVERT = '\0\x02',
	//
	section_link_START_CONVERT_reg = new RegExp(section_link_START_CONVERT, 'g'),
	//
	section_link_END_CONVERT_reg = new RegExp(section_link_END_CONVERT, 'g');

	/**
	 * 從話題/議題/章節標題產生連結到章節標題的wikilink。
	 * 
	 * @example <code>
	CeL.wiki.section_link(section_title)
	 * </code>
	 * 
	 * @param {String}section_title
	 *            section title in wikitext. 章節標題。 節のタイトル。
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * 
	 * @returns {Array}link object (see below)
	 * 
	 * @see [[H:MW]], {{anchorencode:章節標題}}, [[Template:井戸端から誘導の使用]], escapeId()
	 * @see https://phabricator.wikimedia.org/T152540
	 *      https://lists.wikimedia.org/pipermail/wikitech-l/2017-August/088559.html
	 */
	function section_link(section_title, options) {
		if (typeof options === 'string') {
			options = {
				page_title : options
			};
		} else if (typeof options === 'function') {
			options = {
				// TODO
				callback : options
			};
		}

		var parsed_title = preprocess_section_link_tokens(
		// []: 避免被當作 <pre>
		parse_wikitext(section_title, null, [])),
		// 注意: 當這空白字園出現在功能性token中時，可能會出錯。
		id = parsed_title.toString().trim().replace(/[ \n]{2,}/g, ' '),
		// anchor: 可以直接拿來做 wikilink anchor 的章節標題。
		// 有多個完全相同的 anchor 時，後面的會加上"_2", "_3",...。
		// 這個部分的處理請見 function for_each_section()
		anchor = section_link_escape(id
		// 處理連續多個空白字元。長度相同的情況下，盡可能保留原貌。
		.replace(/([ _]){2,}/g, '$1').replace(/&/g, '&amp;'), true);

		// console.log(parsed_title);
		for_each_token.call(parsed_title, function(token, index, parent) {
			if (token.type === 'convert') {
				// @see wiki_toString.convert
				// return token.join(';');
				token.toString = function() {
					return section_link_START_CONVERT + this.join(';')
							+ section_link_END_CONVERT;
				};
			} else if (token.original_type) {
				// revert type
				token.type = token.original_type;
				token.toString = wiki_toString[token.type];
				// 保留 display_text 中的 ''', '', <b>, <i>, <span> 屬性。
				if (token.type === 'tag') {
					// 容許一些特定標籤能夠顯示格式: 會到這裡的應該都是一些被允許顯示格式的特定標籤。
					token.unshift(token.tag_attributes);
				}
			} else if (token.type === 'tag' || token.type === 'tag_single') {
				parent[index] = token.toString().replace(/</g, '&lt;');

			} else if (token.is_plain) {
				// @see use library_namespace.DOM.Unicode_to_HTML()
				token[0] = token[0].replace(/&/g, '&amp;')
				// 這邊也必須 escape "<>"
				.replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g,
						"&apos;");
			}
		}, true);
		// console.log(parsed_title);
		// console.log(parsed_title.toString().trim());

		// display_text 應該是對已經正規化的 section_title 再作的變化。
		var display_text = section_link_escape(parsed_title.toString().trim())
		// recover language conversion -{}-
		.replace(section_link_START_CONVERT_reg, '-{').replace(
				section_link_END_CONVERT_reg, '}-');

		// link = [ page title 頁面標題, anchor / section title 章節標題,
		// display_text / label 要顯示的連結文字 default: section_title ]
		var link = [ options && options.page_title, anchor, display_text ];
		// console.log(link);
		Object.assign(link, {
			// link.id = {String}id
			id : id,
			// original section title
			title : section_title,
			// only for debug
			// parsed_title : parsed_title,
			toString : section_link_toString
		});
		return link;
	}

	// ------------------------------------------

	/**
	 * <code>

	CeL.wiki.sections(page_data);
	page_data.sections.forEach(for_sections, page_data.sections);

	CeL.wiki.sections(page_data)
	//
	.forEach(for_sections, page_data.sections);

	 * </code>
	 */

	// 將 wikitext 拆解為各 section list
	// get {Array}section list
	//
	// @deprecated: 無法處理 '<pre class="c">\n==t==\nw\n</pre>'
	// use for_each_section() instead.
	function deprecated_get_sections(wikitext) {
		var page_data;
		if (get_page_content.is_page_data(wikitext)) {
			page_data = wikitext;
			wikitext = get_page_content(page_data);
		}
		if (!wikitext || typeof wikitext !== 'string') {
			return;
		}

		var section_list = [], index = 0, last_index = 0,
		// 章節標題。
		section_title,
		// [ all title, "=", section title ]
		PATTERN_section = /\n(={1,2})([^=\n]+)\1\s*\n/g;

		section_list.toString = function() {
			return this.join('');
		};
		// 章節標題list。
		section_list.title = [];
		// index hash
		section_list.index = Object.create(null);

		while (true) {
			var matched = PATTERN_section.exec(wikitext),
			// +1 === '\n'.length: skip '\n'
			// 使每個 section_text 以 "=" 開頭。
			next_index = matched && matched.index + 1,
			//
			section_text = matched ? wikitext.slice(last_index, next_index)
					: wikitext.slice(last_index);

			if (false) {
				// 去掉章節標題。
				section_text.replace(/^==[^=\n]+==\n+/, '');
			}

			library_namespace.debug('next_index: ' + next_index + '/'
					+ wikitext.length, 3, 'get_sections');
			// console.log(matched);
			// console.log(PATTERN_section);

			if (section_title) {
				// section_list.title[{Number}index] = {String}section title
				section_list.title[index] = section_title;
				if (section_title in section_list) {
					library_namespace.debug('重複 section title ['
							+ section_title + '] 將僅取首個 section text。', 2,
							'get_sections');

				} else {
					if (!(section_title >= 0)) {
						// section_list[{String}section title] =
						// {String}wikitext
						section_list[section_title] = section_text;
					}

					// 不採用 section_list.length，預防 section_title 可能是 number。
					// section_list.index[{String}section title] = {Number}index
					section_list.index[section_title] = index;
				}
			}

			// 不採用 section_list.push(section_text);，預防 section_title 可能是 number。
			// section_list[{Number}index] = {String}wikitext
			section_list[index++] = section_text;

			if (matched) {
				// 紀錄下一段會用到的資料。

				last_index = next_index;

				section_title = matched[2].trim();
				// section_title = section_link(section_title).id;
			} else {
				break;
			}
		}

		if (page_data) {
			page_data.sections = section_list;
			// page_data.lead_text = lead_text(section_list[0]);
		}

		// 檢核。
		if (false && wikitext !== section_list.toString()) {
			// debug 用. check parser, test if parser working properly.
			throw new Error('get_sections: Parser error'
			//
			+ (page_data ? ': ' + get_page_title_link(page_data) : ''));
		}
		return section_list;
	}

	/**
	 * 為每一個章節(討論串)執行特定作業 for_section(section)
	 * 
	 * CeL.wiki.parser.parser_prototype.each_section
	 * 
	 * TODO: 這會漏算沒有日期標示的簽名
	 * 
	 * @example <code>
	parsed = CeL.wiki.parser(page_data);
	parsed.each_section(function(section, index) {
		if (index === 0) {
			// first_section = section;
			return;
		}
		console.log('#' + section.section_title);
		console.log([ section.users, section.dates ]);
	}, {
		get_users : true,
		// set options[KEY_SESSION] for parse_date()
		session : wiki
	});
	 * </code>
	 */
	function for_each_section(for_section, options) {
		options = library_namespace.setup_options(options);

		var _this = this, page_title = this.page && this.page.title,
		// sections[0]: 常常是設定與公告區，或者放置維護模板/通知模板。
		section_list = this.sections = [],
		// section_title_hash[section link anchor] = {Natural}count
		section_title_hash = Object.create(null);

		// to test: 沒有章節標題的文章, 以章節標題開頭的文章, 以章節標題結尾的文章, 章節標題+章節標題。

		// 加入 **上一個** section, "this_section"
		function add_section(next_section_title_index) {
			// section_title === parser[section.range[0] - 1]
			var this_section_title_index = section_list.length > 0 ? section_list[section_list.length - 1].range[1]
					: undefined,
			// range: 本 section inner 在 root parserd 中的 index.
			// parserd[range[0]] to parserd[range[1]] - 1
			range = [ this_section_title_index >= 0
			// +1: 這個範圍不包括 section_title。
			? this_section_title_index + 1 : 0, next_section_title_index ],
			//
			section = _this.slice(range[0], range[1]);
			if (this_section_title_index >= 0) {
				section.section_title = _this[this_section_title_index];
			}
			section.range = range;
			section.toString = _this.toString;
			section_list.push(section);
		}

		// get topics using for_each_token()
		// 讀取每一個章節的資料: 標題,內容
		// TODO: 不必然是章節，也可以有其它不同的分割方法。
		// TODO: 可以讀取含入的子頁面
		this.each('section_title', function(section_title_token,
				section_title_index) {
			if (page_title) {
				// [0]: page title
				section_title_token.link[0] = page_title;
			}
			if (section_title_hash[section_title_token.link[1]] > 0) {
				section_title_token.link[1] += '_'
				// 有多個完全相同的anchor時，後面的會加上"_2", "_3",...。
				+ (++section_title_hash[section_title_token.link[1]]);
			} else {
				section_title_hash[section_title_token.link[1]] = 1;
			}

			var level = section_title_token.level;
			if (
			// 要篩選的章節標題層級 e.g., {level_filter:3}
			1 <= options.level_filter ? level === options.level_filter
			// e.g., {level_filter:[1,2]}
			: Array.isArray(options.level_filter) ? options.level_filter
					.includes(level)
			// default: level 2
			: level === 2) {
				// 僅處理階級2的章節標題。
				add_section(section_title_index);
			}
		}, Object.assign({
			modify : false,
			// Only check the first level. 只檢查第一層之章節標題。
			max_depth : 1
		},
		// options.for_each_token_options
		options));
		// add the last section
		add_section(this.length);
		if (section_list[0].range[1] === 0) {
			// 第一個章節為空。 e.g., 以章節標題開頭的文章。
			section_list.shift();
		}

		// ----------------------------

		// 讀取每一個章節的資料: 參與討論者,討論發言的時間
		// 統計各討論串中簽名的次數和發言時間。
		// TODO: 無法判別先日期，再使用者名稱的情況。 e.g., [[w:zh:Special:Diff/54030530]]
		if (options.get_users) {
			section_list.forEach(function(section) {
				// console.log(section);
				// console.log('section: ' + section.toString());

				// [[WP:TALK]] conversations, dialogues, discussions, messages
				// section.discussions = [];
				// 發言用戶名順序
				section.users = [];
				// 發言時間日期
				section.dates = [];
				for (var section_index = 0,
				// list buffer
				buffer = [], this_user, token;
				// Only check the first level. 只檢查第一層。
				// check <b>[[User:|]]</b>
				section_index < section.length || buffer.length > 0;) {
					token = buffer.length > 0 ? buffer.shift()
							: section[section_index++];
					while (/* token && */token.type === 'list') {
						// 因為使用習慣問題，每個列表必須各別計算使用者留言次數。
						Array.prototype.unshift.apply(buffer, token.slice(1));
						token = token[0];
					}

					if (typeof token === 'string') {
						// assert: {String}token
						if (!token.trim() && token.includes('\n\n')) {
							// 預設簽名必須與日期在同一行。不可分段。
							this_user = null;
							continue;
						}

					} else {
						// assert: {Array}token
						token = token.toString();
						// assert: wikiprojects 計畫的簽名("~~~~~")必須要先從名稱再有日期。
						// 因此等到出現日期的時候再來處理。
						// 取得依照順序出現的使用者序列。
						var user_list = parse_all_user_links(token, true);
						if (false && section.section_title
								&& section.section_title.title.includes('')) {
							console.log('token: ' + token);
							console.log('user_list: ' + user_list);
						}

						// 判別一行內有多個使用者名稱的情況。取最後一個簽名。
						if (user_list.length > 0) {
							this_user = user_list[user_list.length - 1];
							// ↑ 這個使用者名稱可能為 bot。
							if (options.ignore_bot
									&& PATTERN_BOT_NAME.test(this_user)) {
								this_user = null;
							}
						}

						// --------------------------------
						if (false) {
							// 以下為取得多個使用者名稱的情況下，欲判別出簽名的程式碼。由於現在僅簡單取用最後一個簽名，已經被廢棄。

							if (user_list.length > 1
							// assert: 前面的都只是指向機器人頁面的連結。
							&& /^1+0$/.test(user_list.map(function(user) {
								return PATTERN_BOT_NAME.test(user) ? 1 : 0;
							}).join(''))) {
								user_list = user_list.slice(-1);
							}

							// 因為現在有個性化簽名，需要因應之。應該包含像[[w:zh:Special:Diff/48714597]]的簽名。
							if (user_list.length === 1) {
								this_user = user_list[0];
							} else {
								// 同一個token卻沒有找到，或找到兩個以上簽名，因此沒有辦法準確判別到底哪一個才是真正的留言者。
								// console.log(token);
								// console.log(token.length);
								// console.log(this_user);
								if (user_list.length >= 2
								// 若是有其他非字串的token介於名稱與日期中間，代表這個名稱可能並不是發言者，那麼就重設名稱。
								// 簽名長度不應超過255位元組。
								|| token.length > 255 - '[[U:n]]'.length) {
									// 一行內有多個使用者名稱的情況，取最後一個？
									// 例如簽名中插入自己的舊名稱或者其他人的情況
									this_user = null;
								}
								if (!this_user) {
									continue;
								}
							}
						}

						// 繼續解析日期，預防有類似 "<b>[[User:]] date</b>" 的情況。
					}

					var date = parse_date(token, options);
					// console.log([ this_user, date ]);
					if (!date || !this_user) {
						continue;
					}
					// 同時添加使用者與日期
					section.dates.push(date);
					section.users.push(this_user);
					// reset
					this_user = null;
				}

				if (false) {
					parser.each_section();
					// scan / traversal section templates:
					parser.each.call(parser.sections[section_index],
							'template', function(token) {
								;
							});
				}

				if (false) {
					// 首位發言者, 發起人 index
					section.initiator_index = parser.each_section.index_filter(
							section, true, 'first');
				}

				// 最後發言日期 index
				var last_update_index = for_each_section.index_filter(section,
						true, 'last');
				// section.users[section.last_update_index] = {String}最後更新發言者
				// section.dates[section.last_update_index] = {Date}最後更新日期
				if (last_update_index >= 0) {
					section.last_update_index = last_update_index;
				}
				// 回應數量
				section.replies
				// 要先有不同的人發言，才能算作有回應。
				= section.users.unique().length >= 2 ? section.users.length - 1
						: 0;
				// console.log('users: ' + section.users);
				// console.log('replies: ' + section.replies);
			});
		}

		if (typeof for_section === 'function') {
			// for_section(section, section_index)
			section_list.some(for_section);
		}
		return this;
	}

	// var section_index_filter =
	// CeL.wiki.parser.parser_prototype.each_section.index_filter;
	for_each_section.index_filter = function filter_users_of_section(section,
			filter, type) {
		// filter: user_name_filter
		var _filter;
		if (typeof filter === 'function') {
			_filter = filter;
		} else if (Array.isArray(filter)) {
			_filter = function(user_name) {
				// TODO: filter.some()
				return filter.includes(user_name);
			};
		} else if (library_namespace.is_Object(filter)) {
			_filter = function(user_name) {
				return user_name in filter;
			};
		} else if (library_namespace.is_RegExp(filter)) {
			_filter = function(user_name) {
				return filter.test(user_name);
			};
		} else if (typeof filter === 'string') {
			_filter = function(user_name) {
				return filter === user_name;
			};
		} else if (filter === true) {
			_filter = function() {
				return true;
			};
		} else {
			throw 'for_each_section.index_filter: Invalid filter: ' + filter;
		}

		// ----------------------------

		if (!type) {
			var user_and_date_indexs = [];
			section.users.forEach(function(user_name, index) {
				if (_filter(user_name)) {
					user_and_date_indexs.push(index);
				}
			});

			return user_and_date_indexs;
		}

		// ----------------------------

		var index_specified, date_specified;

		section.dates.forEach(function(date, index) {
			// assert: {Date}date is valid
			date = date.getTime();
			if (type === 'first' ? date_specified <= date : type === 'last'
					&& date < date_specified) {
				return;
			}

			var user_name = section.users[index];
			if (_filter(user_name)) {
				date_specified = date;
				index_specified = index;
			}
		});

		return index_specified;
	};

	/**
	 * 設定好，並執行解析頁面的作業。
	 * 
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * 
	 * @returns {wiki page parser}
	 * 
	 * @see parse_wikitext()
	 */
	function parse_page(options) {
		if (!this.parsed
		// re-parse
		|| options && (options.reparse || options.wikitext)) {
			// assert: this = [ {String} ]
			// @see function page_parser(wikitext, options)
			var parsed = options && options.wikitext || this[0];
			parsed = parse_wikitext(parsed, Object.assign({
				target_array : this
			}, this.options, options));
			// library_namespace.log(parsed);
			if (!Array.isArray(parsed) || parsed.type !== 'plain') {
				this[0] = parsed;
			}
			this.parsed = true;
		}
		return this;
	}

	// parse <ref> of page
	// TODO: <ref group="">
	// TODO: <ref> in template
	function parse_references(options) {
		if (this.reference_list)
			return this.reference_list;

		if (typeof options === 'function') {
			options = {
				processor : options
			};
		}

		/** {Array}參考文獻列表, starts from No. 1 */
		var reference_list = new Array(1);

		this.each(function(token) {
			if (!token.tag || token.tag.toLowerCase() !== 'ref')
				return;

			if (typeof options.processor === 'function') {
				options.processor.apply(null, arguments);
			}

			if (token.attributes && ('name' in token.attributes)) {
				var attribute_name = token.attributes.name,
				// <ref>: name 屬性不能使用數字，請使用可描述內容的標題
				list = reference_list[attribute_name];
				if (list) {
					// index with the same name
					token.reference_index = list.length;
					list.push(token);
					// 已存在相同的名稱，不添加到 reference_list 以增加 NO。
				} else {
					token.reference_index = 0;
					list = [ token ];
					reference_list[attribute_name] = list;
					reference_list.push(list);
				}
				if (!list.main && token.type === 'tag'
				// 會採用第一個有內容的。
				&& token[1].toString().trim()) {
					list.main = token;
				}

			} else {
				reference_list.push(token);
			}

		}, false, Infinity);

		this.reference_list = reference_list;
		return reference_list;
	}

	// {{*Navigation templates}} (footer navboxes)
	// {{Coord}} or {{coord missing}}
	// {{Authority control}}
	// {{featured list}}, {{featured article}}, {{good article}}
	// {{Persondata}}
	// {{DEFAULTSORT:}}
	// [[Category:]]
	// {{Stub}}
	/** {Array}default footer order */
	var default_footer_order = 'transclusion|Coord,Coord Missing|Authority Control|Featured List,Featured Article,Good Article|Persondata|DEFAULTSORT,デフォルトソート|category|Stub'
	//
	.split('|').map(function(name) {
		if (name.includes(','))
			return name.split(',');
		return name;
	});

	// return
	// {Natural+0}: nodes listed in order_list
	// undefined: comments / <nowiki> or text may ignored ('\n') or other texts
	// NOT_FOUND < 0: unknown node
	function footer_order(node_to_test, order_list) {
		if (false && typeof node_to_test === 'string') {
			// skip text. e.g., '\n\n'
			return;
		}

		var type = node_to_test.type;
		if (!order_list) {
			order_list = default_footer_order;
		}
		if (type === 'category') {
			var order = order_list.lastIndexOf('category');
			if (order >= 0) {
				return order;
			}
		}

		if (type === 'transclusion') {
			var order = order_list.length, name = node_to_test.name;
			while (--order > 0) {
				var transclusion_name = order_list[order];
				if (Array.isArray(transclusion_name) ? transclusion_name
						.includes(name) : transclusion_name === name) {
					return order;
				}
			}
			if (order_list[0] === 'transclusion') {
				// skip [0]
				return 0;
			}

			if (false) {
				// other methods 1
				// assert: NOT_FOUND + 1 === 0
				return order_list.indexOf(node_to_test.name) + 1;

				// other methods 2
				if (order === NOT_FOUND) {
					// 當作 Navigation templates。
					return 0;
					library_namespace.debug('skip error/unknown transclusion: '
							+ node_to_test);
				}
				return order;
			}

		}

		if (type === 'comment' || node_to_test.tag === 'nowiki') {
			// skip comment. e.g., <!-- -->, <nowiki />
			return;
		}

		if (type) {
			library_namespace.debug('skip error/unknown node: ' + node_to_test);
			return NOT_FOUND;
		}

		// 其他都不管了。
	}

	function insert_before(before_node, to_insert) {
		var order_needed = parse_wikitext(before_node, null, []), order_list = this.order_list;
		if (order_needed) {
			order_needed = footer_order(order_needed, order_list);
		}
		if (!(order_needed >= 0)) {
			library_namespace.warn('insert_before: skip error/unknown node: '
					+ node_to_test);
			return this;
		}

		var index = this.length;
		// 從後面開始搜尋。
		while (index-- > 0) {
			// find the node/place to insert before
			if (typeof this[index] === 'string') {
				// skip text. e.g., '\n\n'
				continue;
			}
			var order = footer_order(this[index], order_list);
			if (order >= 0) {
				if (order === order_needed) {
					// insert before node_to_test
					this.splice(index, 0, to_insert);
					break;
				}

				if (order < order_needed) {
					// 已經過頭。
					// insert AFTER node_to_test
					this.splice(index + 1, 0, to_insert);
					break;
				}
			}
		}

		return this;
	}

	/**
	 * 將特殊標記解譯/還原成 {Array} 組成之結構。
	 * 
	 * @param {Array}queue
	 *            temporary queue.
	 * @param {String}include_mark
	 *            解析用之起始特殊標記。
	 * @param {String}end_mark
	 *            結束之特殊標記。
	 * 
	 * @see parse_wikitext()
	 */
	function resolve_escaped(queue, include_mark, end_mark) {
		if (false) {
			library_namespace.debug('queue: ' + queue.join('\n--- '), 4,
					'resolve_escaped');
			console.log('resolve_escaped: ' + JSON.stringify(queue));
		}
		queue.forEach(function(item, index) {
			if (false)
				library_namespace.debug([ 'item', index, item ], 4,
						'resolve_escaped');
			if (typeof item !== 'string')
				// assert: Array.isArray(item)
				return;

			// result queue
			var result = [];

			item.split(include_mark).forEach(function(token, index) {
				if (index === 0) {
					if (token) {
						result.push(token);
					}
					return;
				}
				index = token.indexOf(end_mark);
				if (index === 0) {
					result.push(include_mark);
					return;
				}
				result.push(queue[+token.slice(0, index)]);
				if (token = token.slice(index + end_mark.length))
					result.push(token);
			});

			if (result.length > 1) {
				// console.log(result);
				set_wiki_type(result, 'plain');
			} else {
				result = result[0];
			}
			if (result.includes(include_mark)) {
				throw new Error('resolve_escaped: 仍有 include mark 殘留！');
			}
			queue[index] = result;
		});
		// console.log('resolve_escaped end: '+JSON.stringify(queue));
	}

	// 經測試發現 {{...}} 名稱中不可有 [{}<>\[\]]
	// while(/{{{[^{}\[\]]+}}}/g.exec(wikitext));
	// 但允許 "{{\n name}}"
	// 模板名#後的內容會忽略。
	/** {RegExp}模板的匹配模式。 */
	var PATTERN_transclusion = /{{[\s\n]*([^\s\n#\|{}<>\[\]][^#\|{}<>\[\]]*)(?:#[^\|{}]*)?((?:\|[^<>\[\]]*)*?)}}/g,
	/** {RegExp}wikilink內部連結的匹配模式。 */
	PATTERN_link = /\[\[[\s\n]*([^\s\n\|{}<>\[\]�][^\|{}<>\[\]�]*)((?:\|[^\|{}<>\[\]]*)*)\]\]/g,
	/**
	 * {RegExp}wikilink內部連結的匹配模式v2 [ all_link, page_and_section, page_name,
	 * section_title, displayed_text ]
	 * 
	 * 頁面標題不可包含無效的字元：[\n\[\]{}�]，經測試 anchor 亦不可包含[\n\[\]{}]，但 display text 可以包含
	 * [\n]
	 */
	PATTERN_wikilink = /\[\[(([^\[\]\|{}\n#�]+)(#(?:-{[^\[\]{}\n\|]+}-|[^\[\]{}\n\|]+)?)?|#[^\[\]{}\n\|]+)(?:\|([\s\S]+?))?\]\]/,
	//
	PATTERN_wikilink_global = new RegExp(PATTERN_wikilink.source, 'g'),
	/**
	 * Wikimedia projects 的 external link 匹配模式。
	 * 
	 * matched: [ all external link wikitext, URL, delimiter, link name ]
	 * 
	 * 2016/2/23: 經測試，若為結尾 /$/ 不會 parse 成 external link。<br />
	 * 2016/2/23: "[ http...]" 中間有空白不會被判別成 external link。
	 * 
	 * @type {RegExp}
	 * 
	 * @see PATTERN_URL_GLOBAL, PATTERN_URL_WITH_PROTOCOL_GLOBAL,
	 *      PATTERN_URL_prefix, PATTERN_WIKI_URL, PATTERN_wiki_project_URL,
	 *      PATTERN_external_link_global
	 * 
	 * @see https://zh.wikipedia.org/w/api.php?action=query&meta=siteinfo&siprop=protocols&utf8&format=json
	 */
	PATTERN_external_link_global = /\[((?:https?:|ftps?:)?\/\/[^\s\|<>\[\]{}\/][^\s\|<>\[\]{}]*)(?:(\s)([^\]]*))?\]/ig,
	/** {String}以"|"分開之 wiki tag name。 [[Help:Wiki markup]], HTML tags. 不包含 <a>！ */
	markup_tags = 'nowiki|references|ref|includeonly|noinclude|onlyinclude|math|syntaxhighlight|br|hr|bdi|b|del|ins|i|u|font|big|small|sub|sup|h[1-6]|cite|code|em|strike|strong|s|tt|var|div|center|blockquote|[oud]l|table|caption|pre|ruby|r[tbp]|p|span|abbr|dfn|kbd|samp|data|time|mark',
	// MediaWiki可接受的 HTML void elements 標籤.
	// NO b|span|sub|sup|li|dt|dd|center|small
	// 包含可使用，亦可不使用 self-closing 的 tags。
	// self-closing: void elements + foreign elements
	// https://www.w3.org/TR/html5/syntax.html#void-elements
	// @see [[phab:T134423]]
	// https://www.mediawiki.org/wiki/Manual:OutputPage.php
	self_close_tags = 'nowiki|references|ref|area|base|br|col|embed|hr|img|input|keygen|link|meta|param|source|track|wbr',
	/** {RegExp}HTML tags 的匹配模式。 */
	PATTERN_WIKI_TAG = new RegExp('<(' + markup_tags
			+ ')(\\s[^<>]*)?>([\\s\\S]*?)<\\/(\\1)>', 'ig'),
	/** {RegExp}HTML tags 的匹配模式 of <nowiki>。 */
	PATTERN_WIKI_TAG_of_nowiki = new RegExp('<(' + 'nowiki'
			+ ')(\\s[^<>]*)?>([\\s\\S]*?)<\\/(\\1)>', 'ig'),
	/** {RegExp}HTML tags 的匹配模式 without <nowiki>。 */
	PATTERN_WIKI_TAG_without_nowiki = new RegExp('<('
			+ markup_tags.replace('nowiki|', '')
			+ ')(\\s[^<>]*)?>([\\s\\S]*?)<\\/(\\1)>', 'ig'),
	/** {RegExp}HTML self closed tags 的匹配模式。 */
	PATTERN_WIKI_TAG_VOID = new RegExp('<(' + self_close_tags
			+ ')(\\s[^<>]*)?>', 'ig'),
	// 在其內部的wikitext不會被parse。
	no_parse_tags = 'pre|nowiki'.split('|').to_hash();

	/**
	 * .toString() of wiki elements: wiki_toString[token.type]<br />
	 * parse_wikitext() 將把 wikitext 解析為各 {Array} 組成之結構。當以 .toString() 結合時，將呼叫
	 * .join() 組合各次元素。此處即為各 .toString() 之定義。<br />
	 * 所有的 key (type) 皆為小寫。
	 * 
	 * @type {Object}
	 * 
	 * @see parse_wikitext()
	 */
	var wiki_toString = {
		// internal/interwiki link : language links : category links, file,
		// subst 替換引用, ... : title
		// e.g., [[m:en:Help:Parser function]], [[m:Help:Interwiki linking]],
		// [[:File:image.png]], [[wikt:en:Wiktionary:A]],
		// [[:en:Template:Editnotices/Group/Wikipedia:Miscellany for deletion]]
		// [[:en:Marvel vs. Capcom 3: Fate of Two Worlds]]
		// [[w:en:Help:Link#Http: and https:]]
		//
		// 應當使用 [[w:zh:維基百科:編輯提示|編輯提示]] 而非 [[:zh:w:維基百科:編輯提示|編輯提示]]，
		// 見 [[User:Cewbot/Stop]]。
		//
		// @see [[Wikipedia:Namespace]]
		// https://www.mediawiki.org/wiki/Markup_spec#Namespaces
		// [[ m : abc ]] is OK, as "m : abc".
		// [[: en : abc ]] is OK, as "en : abc".
		// [[ :en:abc]] is NOT OK.
		namespace : function() {
			return this.join(this.oddly ? '' : ':');
		},
		// page title, template name
		page_title : function() {
			return this.join(':');
		},
		// link 的變體。但可採用 .name 取得 file name。
		file : function() {
			return '[[' + this[0] + this[1]
			//
			+ (this.length > 2 ? '|' + this.slice(2).join('|') : '') + ']]';
		},
		// link 的變體。但可採用 .name 取得 category name。
		category : function() {
			return '[[' + this[0] + this[1]
			//
			+ (this.length > 2 ? '|' + this.slice(2).join('|') : '') + ']]';
		},
		// 內部連結 (wikilink / internal link) + interwiki link
		link : function() {
			return '[[' + this[0] + this[1]
			//
			+ (this.length > 2 ? '|' + this[2] : '') + ']]';
		},
		// 外部連結 external link, external web link
		external_link : function() {
			return '[' + this.join(this.delimiter || ' ') + ']';
		},
		url : function() {
			return this.join('');
		},
		// template parameter
		parameter : function() {
			return '{{{' + this.join('|') + '}}}';
		},
		// e.g., template
		transclusion : function() {
			return '{{' + this.join('|') + '}}';
		},
		// [[Help:Table]]
		table : function() {
			// this: [ table style, row, row, ... ]
			return '{|' + this.join('\n|-') + '\n|}';
		},
		// table caption
		caption : function() {
			// this: [ main caption, invalid caption, ... ]
			return '\n|+' + this.join('||');
		},
		table_row : function() {
			// this: [ row style, cell, cell, ... ]
			return this.join('');
		},
		table_cell : function() {
			// this: [ contents ]
			// this.delimiter:
			// /\n[!|]|!!|\|\|/ or undefined (在 style/第一區間就已當作 cell)
			return (this.delimiter || '') + this.join('');
		},
		// attributes, styles
		table_style : function() {
			return this.join('');
		},
		// 手工字詞轉換 language conversion -{}-
		convert : function(language, lang_fallbacks) {
			if (!language) {
				return '-{' + this.join(';') + '}-';
			}

			language = language.toLowerCase();

			// https://zh.wikipedia.org/w/api.php?action=query&meta=siteinfo&siprop=general%7Cnamespaces%7Cnamespacealiases%7Cstatistics
			// language fallbacks: [[mw:Localisation statistics]]
			// (zh-tw, zh-hk, zh-mo) → zh-hant (→ zh?)
			// (zh-cn, zh-sg, zh-my) → zh-hans (→ zh?)
			// [[Wikipedia_talk:地区词处理#zh-my|馬來西亞簡體華語]]
			// [[MediaWiki:Variantname-zh-tw]]
			if (!this.conversion[language]) {
				if (/^zh-(?:tw|hk|mo)/.test(language)) {
					language = 'zh-hant';
				} else if (/^zh/.test(language)) {
					language = 'zh-hans';
				}
			}

			return this.conversion[language] || '在手动语言转换规则中检测到错误';
		},

		// Behavior switches
		'switch' : function() {
			// assert: this.length === 1
			return '__' + this[0] + '__';
		},
		// italic type
		italic : function() {
			return "''" + this.join('') + "''";
		},
		// emphasis
		bold : function() {
			return "'''" + this.join('') + "'''";
		},

		// section title / section name
		// show all section titles:
		// parser=CeL.wiki.parser(page_data);parser.each('section_title',function(token,index){console.log('['+index+']'+token.title);},false,1);
		// @see for_each_token()
		// parser.each('plain',function(token){},{slice:[1,2]});
		section_title : function() {
			var level = '='.repeat(this.level);
			return level
			// this.join(''): 必須與 wikitext 相同。見 parse_wikitext.title。
			+ this.join('') + level + (this.postfix || '');
		},

		// [[Help:Wiki markup]], HTML tags
		tag : function() {
			// this: [ {String}attributes, {Array}inner nodes ].tag
			// 欲取得 .tagName，請用 this.tag.toLowerCase();
			// 欲取得 .inner nodes，請用 this[1];
			// 欲取得 .innerHTML，請用 this[1].toString();
			return '<' + this.tag + (this[0] || '') + '>' + this[1] + '</'
					+ (this.end_tag || this.tag) + '>';
		},
		tag_attributes : function() {
			return this.join('');
		},
		tag_inner : function() {
			return this.join('');
		},
		tag_single : function() {
			// this: [ {String}attributes ].tag
			// 欲取得 .tagName，請用 this.tag.toLowerCase();
			return '<' + this.tag + this.join('') + '>';
		},

		// comments: <!-- ... -->
		comment : function() {
			// "<\": for Eclipse JSDoc.
			return '<\!--' + this.join('') + (this.no_end ? '' : '-->');
		},
		line : function() {
			// https://www.mediawiki.org/wiki/Markup_spec/BNF/Article
			// NewLine = ? carriage return and line feed ? ;
			return this.join('\n');
		},
		list : function() {
			var list_prefix = this.list_prefix;
			return this.map(function(item, index) {
				return (list_prefix && list_prefix[index] || '') + item;
			}).join('');

			return this.list_type + this.join('\n' + this.get_item_prefix());
		},
		pre : function() {
			return ' ' + this.join('\n ');
		},
		hr : function() {
			return this[0];
		},
		paragraph : function() {
			return this.join('\n') + (this.separator || '');
		},
		// plain text 或尚未 parse 的 wikitext.
		plain : function() {
			return this.join('');
		}
	};

	// const , for <dl>
	var DEFINITION_LIST = 'd';
	function get_item_prefix() {
		if (!this.parent)
			return this.list_type;
		return this.parent.get_item_prefix() + this.list_type;
	}

	var Magic_words_hash = Object.create(null);
	// https://zh.wikipedia.org/w/api.php?action=query&meta=siteinfo&siprop=functionhooks&utf8&format=json
	'DISPLAYTITLE|DEFAULTSORT|デフォルトソート|NAMESPACE|LOCALURL|FULLURL|FILEPATH|URLENCODE|NS|LC|UC|UCFIRST'
	// 這些需要指定數值. e.g., {{DEFAULTSORT:1}}: OK, {{DEFAULTSORT}}: NG
	.split('|').forEach(function name(Magic_words) {
		Magic_words_hash[Magic_words] = false;
	});
	// https://zh.wikipedia.org/w/api.php?action=query&meta=siteinfo&siprop=variables&utf8&format=json
	'CURRENTYEAR|CURRENTMONTH|CURRENTDAY|CURRENTTIME|CURRENTHOUR|CURRENTWEEK|CURRENTTIMESTAMP|FULLPAGENAME|PAGENAME|BASEPAGENAME|SUBPAGENAME|SUBJECTPAGENAME|TALKPAGENAME'
	// 這些不用指定數值.
	.split('|').forEach(function name(Magic_words) {
		Magic_words_hash[Magic_words] = true;
	});

	// 經測試，":"前面與後面不可皆有空白。
	// (\s{2,}): 最後的單一/\s/會被轉換為"&#160;"
	// matched: [ all, leading spaces,
	// this language code, colon, this language token, last spaces ]
	var PATTERN_conversion = /^(\s*)(zh-(?:cn|tw|hk|mo|sg|my|hant|hans))(\s*:|:\s*)([^\s].*?)(\s{2,})?$/;

	// 狀態開關: [[mw:Help:Magic words#Behavior switches]]
	var PATTERN_BEHAVIOR_SWITCH = /__([A-Z]+(?:_[A-Z]+)*)__/g;
	PATTERN_BEHAVIOR_SWITCH = /__(NOTOC|FORCETOC|TOC|NOEDITSECTION|NEWSECTIONLINK|NONEWSECTIONLINK|NOGALLERY|HIDDENCAT|NOCONTENTCONVERT|NOCC|NOTITLECONVERT|NOTC|INDEX|NOINDEX|STATICREDIRECT|NOGLOBAL)__/g;

	// [[w:en:Wikipedia:Extended image syntax]]
	// [[mw:Help:Images]]
	var file_options = {
		// Type, display format, 表示形式
		thumb : 'format',
		thumbnail : 'format',
		frame : 'format',
		framed : 'format',
		frameless : 'format',

		// Border, 外枠, 縁取る, 境界
		border : 'border',

		// Location, Horizontal alignment option, 配置位置
		right : 'location',
		left : 'location',
		// 居中, 不浮動
		center : 'location',
		// 不浮動
		none : 'location',

		// Vertical alignment option, 垂直方向の位置
		baseline : 'alignment',
		middle : 'alignment',
		sub : 'alignment',
		'super' : 'alignment',
		'text-top' : 'alignment',
		'text-bottom' : 'alignment',
		top : 'alignment',
		bottom : 'alignment',

		// Link option
		// link : 'link',

		// alt : 'alt',
		// lang : 'language',

		// https://en.wikipedia.org/wiki/Wikipedia:Creation_and_usage_of_media_files#Setting_a_video_thumbnail_image
		// thumbtime : 'video_thumbtime',
		// start : 'video_start',
		// end : 'video_end',

		// page : 'book_page',
		// 'class' : 'CSS_class',

		// Size, Resizing option
		// 放大倍數
		upright : 'size'
	};

	/**
	 * parse The MediaWiki markup language (wikitext).
	 * 
	 * TODO:<code>

	parse error: [[File:]] 可以允許換行
	[[俄羅斯公民簽證要求]]: [[File:Visa requirements for Russian citizens.png|Visa requirements for Russian citizens|thumb|800px|center|俄罗斯护照持有人可免签证或落地签证前往的国家或地区 
	{{legend|#042E9B|[[俄罗斯]]}}{{legend|#2196f3|[[克里米亚]]}}{{legend|#ffc726|[[:en:Internal_passport_of_Russia|内部护照]]|]]}}{{legend|#22b14c|免签证}}{{legend|#B5E61D|落地签证}}{{legend|#61c09a|电子签证}}{{legend|#79D343|需电子签证或预先在互联网注册}}{{legend|#A8ACAB|需要申请签证}}]]


	提高效率。e.g., [[三国杀武将列表]], [[世界大桥列表]], [[三国杀武将列表]]<br />
	可能為模板參數特殊設計？有些 template 內含不完整的起始或結尾，使 parameter 亦未首尾對應。

	{{L<!-- -->L}} .valueOf() === '{{LL}}'
	<p<!-- -->re>...</pre>
	CeL.wiki.page('上海外国语大学',function(page_data){CeL.wiki.parser(page_data).parse();})
	[https://a.b <a>a</a><!-- -->]
	[[<a>a</a>]]
	CeL.wiki.parser('a[[未來日記-ANOTHER:WORLD-]]b').parse()[1]
	<nowiki>...<!-- -->...</nowiki> 中的註解不應被削掉!

	parse {{Template:Single chart}}

	 * </code>
	 * 
	 * 此功能之工作機制/原理：<br />
	 * 找出完整的最小單元，並將之 push 入 queue，並把原 string 中之單元 token 替換成:<br />
	 * {String}include_mark + ({ℕ⁰:Natural+0}index of queue) + end_mark<br />
	 * e.g.,<br />
	 * "a[[p]]b{{t}}" →<br />
	 * "a[[p]]b\00;", queue = [ ["t"].type='transclusion' ] →<br />
	 * "a\01;b\00;", queue = [ ["t"].type='transclusion', ["p"].type='link' ]<br />
	 * 最後再依 queue 與剩下的 wikitext，以 resolve_escaped() 作 resolve。
	 * 
	 * @param {String}wikitext
	 *            wikitext to parse
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * @param {Array}[queue]
	 *            temporary queue. 基本上僅供內部使用。
	 * 
	 * @returns {Array}parsed data
	 * 
	 * @see https://blog.wikimedia.org/2013/03/04/parsoid-how-wikipedia-catches-up-with-the-web/
	 *      https://phabricator.wikimedia.org/diffusion/GPAR/
	 * 
	 * @see [[w:en:Help:Wikitext]], [[Wiki標記式語言]]
	 *      https://www.mediawiki.org/wiki/Markup_spec/BNF/Article
	 *      https://www.mediawiki.org/wiki/Markup_spec/BNF/Inline_text
	 *      https://www.mediawiki.org/wiki/Markup_spec
	 *      https://www.mediawiki.org/wiki/Wikitext
	 *      https://doc.wikimedia.org/mediawiki-core/master/php/html/Parser_8php.html
	 *      Parser.php: PHP parser that converts wiki markup to HTML.
	 */
	function parse_wikitext(wikitext, options, queue) {
		if (!wikitext) {
			return wikitext;
		}

		function _set_wiki_type(token, type) {
			// 這可能性已經在下面個別處理程序中偵測並去除。
			if (false && typeof token === 'string'
					&& token.includes(include_mark)) {
				queue.push(token);
				resolve_escaped(queue, include_mark, end_mark);
				token = [ queue.pop() ];
			}

			return set_wiki_type(token, type, wikitext);

			// 因為parse_wikitext()採用的是從leaf到root的解析法，因此無法在解析leaf時就知道depth。
			// 故以下廢棄。
			var node = set_wiki_type(token, type);
			library_namespace.debug('set depth ' + depth_of_children
					+ ' to children [' + node + ']', 3, '_set_wiki_type');
			node[KEY_DEPTH] = depth_of_children;
			return node;
		}

		// 正規化並提供可隨意改變的同內容參數，以避免修改或覆蓋附加參數。
		// 每個parse_wikitext()都需要新的options，需要全新的。
		// options = Object.assign({}, options);

		if (false) {
			// assert: false>=0, (undefined>=0)
			// assert: NaN | 0 === 0
			var depth_of_children = ((options && options[KEY_DEPTH]) | 0) + 1;
			// assert: depth_of_children >= 1
			library_namespace.debug('[' + wikitext + ']: depth_of_children: '
					+ depth_of_children, 3, 'parse_wikitext');
			options[KEY_DEPTH] = depth_of_children;
		}

		var
		/**
		 * 解析用之起始特殊標記。<br />
		 * 需找出一個文件中不可包含，亦不會被解析的字串，作為解析用之起始特殊標記。<br />
		 * e.g., '\u0000'.<br />
		 * include_mark + ({ℕ⁰:Natural+0}index of queue) + end_mark
		 * 
		 * assert: /\s/.test(include_mark) === false
		 * 
		 * @type {String}
		 */
		include_mark = options && options.include_mark || '\u0000',
		/**
		 * {String}結束之特殊標記。 end of include_mark. 不可為數字 (\d) 或
		 * include_mark，不包含會被解析的字元如 /;/。應為 wikitext 所不容許之字元。
		 */
		end_mark = options && options.end_mark || '\u0001',
		/** {Boolean}是否順便作正規化。預設不會規範頁面內容。 */
		normalize = options && options.normalize,
		/** {Array}是否需要初始化。 [ {String}prefix added, {String}postfix added ] */
		initialized_fix = !queue && [ '', '' ],
		// 這項設定不應被繼承。
		no_resolve = options && options.no_resolve;
		if (no_resolve) {
			delete options.no_resolve;
		}

		if (/\d/.test(end_mark) || include_mark.includes(end_mark))
			throw new Error('Error end of include_mark!');

		if (initialized_fix) {
			// 初始化。
			// console.log(wikitext);
			wikitext = wikitext.replace(/\r\n/g, '\n').replace(
			// 先 escape 掉會造成問題之 characters。
			new RegExp(include_mark.replace(/([\s\S])/g, '\\$1'), 'g'),
					include_mark + end_mark);
			if (!wikitext.startsWith('\n') &&
			// /\n([*#:;]+|[= ]|{\|)/:
			// https://www.mediawiki.org/wiki/Markup_spec/BNF/Article#Wiki-page
			// https://www.mediawiki.org/wiki/Markup_spec#Start_of_line_only
			/^(?:[*#;:= ]|{\|)/.test(wikitext))
				wikitext = (initialized_fix[0] = '\n') + wikitext;
			if (!wikitext.endsWith('\n'))
				wikitext += (initialized_fix[1] = '\n');
			// temporary queue
			queue = [];
		}

		if (options && typeof options.prefix === 'function')
			wikitext = options.prefix(wikitext, queue, include_mark, end_mark)
					|| wikitext;

		// ------------------------------------------------------------------------
		// parse functions

		// parse attributes
		function parse_tag_attributes(attributes) {
			var attribute_hash = Object.create(null);
			if (typeof attributes === 'string') {
				var attributes_list = [], matched,
				// [ all, front, all attributes, name, value, unquoted value ]
				PATTERN_attribute = /([\s\S]+?)($|([^\s]+)=("[^"]*"|'[^']*'|([^\s]*)))/g;
				while (matched = PATTERN_attribute.exec(attributes)) {
					// console.log(matched);
					attributes_list.push(matched[1]);
					if (matched[2])
						attributes_list.push(matched[2]);
					if (matched[3]) {
						attribute_hash[matched[3]] = matched[5] || matched[4]
						// or use JSON.parse()
						&& matched[4].slice(1, -1).replace(/\\(.)/g, '$1');
					}
				}
				attributes = attributes_list;
			}
			attributes = _set_wiki_type(attributes || '', 'tag_attributes');
			attributes.attributes = attribute_hash;
			return attributes;
		}

		function parse_HTML_tag(all, tag, attributes, inner, end_tag) {
			// console.log('queue start:');
			// console.log(queue);
			var no_parse_tag = tag.toLowerCase() in no_parse_tags;
			// 在章節標題、表格 td/th 或 template parameter 結束時，
			// 部分 HTML font style tag 似乎會被截斷，自動重設屬性，不會延續下去。
			// 因為已經先處理 {{Template}}，因此不需要用 /\n(?:[=|!]|\|})|[|!}]{2}/。
			if (!no_parse_tag && /\n(?:[=|!]|\|})|[|!]{2}/.test(inner)) {
				library_namespace.debug('表格 td/th 或 template parameter 中，'
						+ '此時視為一般 text，當作未匹配 match HTML tag 成功。', 4,
						'parse_wikitext.tag');
				return all;
			}
			// 自 end_mark (tag 結尾) 向前回溯，檢查是否有同名的 tag。
			var matched = inner.match(new RegExp(
			//
			'<(' + tag + ')(\\s[^<>]*)?>([\\s\\S]*?)$', 'i')), previous;
			if (matched) {
				previous = all.slice(0, -matched[0].length
				// length of </end_tag>
				- end_tag.length - 3);
				tag = matched[1];
				attributes = matched[2];
				inner = matched[3];
			} else {
				previous = '';
			}
			library_namespace.debug(previous + ' + <' + tag + '>', 4,
					'parse_wikitext.tag');

			// 2016/9/28 9:7:7
			// 因為no_parse_tag內部可能已解析成其他的單元，因此還是必須parse_wikitext()。
			// e.g., '<nowiki>-{ }-</nowiki>'
			// 經過改變，需再進一步處理。
			library_namespace.debug('<' + tag + '> 內部需再進一步處理。', 4,
					'parse_wikitext.tag');
			attributes = parse_tag_attributes(
			// 預防有特殊 elements 置入其中。此時將之當作普通 element 看待。
			// e.g., '{{tl|<b a{{=}}"A">i</b>}}'
			parse_wikitext(attributes, options, queue));
			inner = parse_wikitext(inner, options, queue);
			// 若為 <pre> 之內，則不再變換。
			// 但 MediaWiki 的 parser 有問題，若在 <pre> 內有 <pre>，
			// 則會顯示出內部<pre>，並取內部</pre>為外部<pre>之結尾。
			// 因此應避免 <pre> 內有 <pre>。
			if (false && !no_parse_tag) {
				inner = inner.toString();
			}

			// [ ... ]: 在 inner 為 Template 之類時，
			// 不應直接在上面設定 type=tag_inner，以免破壞應有之格式！
			// 但仍需要設定 type=tag_inner 以應 for_each_token 之需，因此多層[]包覆。
			inner = _set_wiki_type([ inner || '' ], 'tag_inner');
			all = [ attributes, inner ];

			if (normalize) {
				tag = tag.toLowerCase();
			} else if (tag !== end_tag) {
				all.end_tag = end_tag;
			}
			all.tag = tag;
			// {String}Element.tagName
			// all.tagName = tag.toLowerCase();

			_set_wiki_type(all, 'tag');
			if (attributes && attributes.attributes) {
				all.attributes = attributes.attributes;
				delete attributes.attributes;
			}
			queue.push(all);
			// console.log('queue end:');
			// console.log(queue);
			return previous + include_mark + (queue.length - 1) + end_mark;
		}

		function parse_single_tag(all, tag, attributes) {
			if (attributes) {
				if (normalize) {
					attributes = attributes.replace(/[\s\/]*$/, ' /');
				}
				attributes = parse_tag_attributes(
				// 預防有特殊 elements 置入其中。此時將之當作普通 element 看待。
				// e.g., '{{tl|<b a{{=}}"A">i</b>}}'
				parse_wikitext(attributes, options, queue));
				if (false && attributes.type === 'plain') {
					// assert: 經過 parse_tag_attributes(), 應該不會到這邊。
					all = attributes;
				} else
					all = [ attributes ];
			} else {
				// use '' as attributes in case
				// the .join() in .toString() doesn't work.
				all = [ '' ];
			}

			if (normalize) {
				tag = tag.toLowerCase();
			}
			all.tag = tag;
			// {String}Element.tagName
			// all.tagName = tag.toLowerCase();

			_set_wiki_type(all, 'tag_single');
			if (attributes && attributes.attributes) {
				all.attributes = attributes.attributes;
				delete attributes.attributes;
			}
			queue.push(all);
			return include_mark + (queue.length - 1) + end_mark;
		}

		// or use ((PATTERN_transclusion))
		// PATTERN_template
		var PATTERN_for_transclusion = /{{([^{}][\s\S]*?)}}/g;
		function parse_transclusion(all, parameters) {
			// 自 end_mark 向前回溯。
			var index = parameters.lastIndexOf('{{'),
			// 在先的，在前的，前面的； preceding
			// (previous 反義詞 following, preceding 反義詞 exceeds)
			previous,
			// 因為可能有 "length=1.1" 之類的設定，因此不能採用 Array。
			// token.parameters[{String}key] = {String}value
			_parameters = Object.create(null),
			// token.index_of[{String}key] = {Integer}index
			parameter_index_of = Object.create(null);
			if (index > 0) {
				previous = '{{' + parameters.slice(0, index);
				parameters = parameters.slice(index + '}}'.length);
			} else {
				previous = '';
			}
			library_namespace.debug(
					'[' + previous + '] + [' + parameters + ']', 4,
					'parse_wikitext.transclusion');

			// TODO: 像是 <b>|p=</b> 會被分割成不同 parameters，
			// 但 <nowiki>|p=</nowiki>, <math>|p=</math> 不會被分割！
			parameters = parameters.split('|');
			if (parameters[0].includes(include_mark)
			// if not [[w:en:Help:Conditional expressions]]
			&& !/^[\s\n]*#[a-z]+:/.test(parameters[0])) {
				// e.g., {{ {{tl|t}} | p }}
				return all;
			}

			index = 1;
			parameters = parameters.map(function(token, _index) {
				if (_index === 0
				// 預防有特殊 elements 置入其中。此時將之當作普通 element 看待。
				// e.g., {{ #expr: {{CURRENTHOUR}}+8}}}}
				&& !token.includes(include_mark)) {
					return _set_wiki_type(
					//
					token.split(normalize ? /\s*:\s*/ : ':'), 'page_title');
				}

				// 經過改變，需再進一步處理。
				token = parse_wikitext(token, Object.assign({
					inside_transclusion : true
				}, options), queue);

				var _token = token;
				// console.log(_token);
				if (Array.isArray(_token)) {
					_token = _token[0];
				}
				// console.log(JSON.stringify(_token));
				if (typeof _token === 'string') {
					_token = _token.trim();
					// @see function parse_template()
					var matched = _token.match(/^([^=]+)=([\s\S]*)$/);
					if (matched) {
						var key = matched[1].trimEnd(),
						//
						value = matched[2].trimStart();

						// 若參數名重複: @see [[Category:調用重複模板參數的頁面]]
						// 如果一個模板中的一個參數使用了多於一個值，則只有最後一個值會在顯示對應模板時顯示。
						// parser 調用超過一個Template中參數的值，只有最後提供的值會被使用。
						if (typeof token === 'string') {
							// 處理某些特殊屬性的值。
							if (false && /url$/i.test(key)) {
								try {
									// 有些參數值會迴避"="，此時使用decodeURIComponent可能會更好。
									value = decodeURI(value);
								} catch (e) {
									// TODO: handle exception
								}
							}
							parameter_index_of[key] = _index;
							_parameters[key] = value;

						} else {
							// assert: Array.isArray(token)
							if (false) {
								_token = token.clone();
								// copy properties
								Object.keys(token).forEach(function(p) {
									if (!(p >= 0)) {
										_token[p] = token[p];
									}
								});
							}
							// assert: Array.isArray(token)
							// 因此代表value的_token也採用相同的type。
							_token = [];
							// copy properties, including .toString().
							Object.keys(token).forEach(function(p) {
								_token[p] = token[p];
							});

							_token[0] = value;
							parameter_index_of[key] = _index;
							_parameters[key] = _token;
						}
					} else {
						parameter_index_of[index] = _index;
						_parameters[index++]
						// TODO: token 本身並未 .trim()
						= typeof token === 'string' ? _token : token;
					}

				} else {
					// e.g., {{t|[http://... ...]}}
					if (library_namespace.is_debug(3)) {
						library_namespace.error(
						//
						'parse_wikitext.transclusion: Can not parse ['
						//
						+ token + ']');
						library_namespace.error(token);
						// console.log(_token);
					}
					// TODO: token 本身並未 .trim()
					parameter_index_of[index] = _index;
					_parameters[index++] = token;
				}

				return token;
			});

			// 'Defaultsort' → 'DEFAULTSORT'
			parameters.name = typeof parameters[0][0] === 'string'
			// 後面不允許空白。 must / *DEFAULTSORT:/
			&& parameters[0][0].trimStart().toUpperCase();
			// TODO: {{ {{UCFIRST:T}} }}
			// TODO: {{ :{{UCFIRST:T}} }}
			// console.log(parameters);
			if (parameters.name && (parameters.name in Magic_words_hash)
			// test if token is [[Help:Magic words]]
			&& (Magic_words_hash[parameters.name] || parameters[0].length > 1)) {
				// 此時以 parameters[0][1] 可獲得首 parameter。
				parameters.is_magic_word = true;
			} else {
				parameters.name = typeof parameters[0][0] === 'string'
				//
				&& parameters[0][0].trim().toLowerCase();
				// console.log(parameters.name);
				// .page_name
				parameters.page_title = normalize_page_name(
				// incase "{{ DEFAULTSORT : }}"
				// 正規化 template name。
				// 'ab/cd' → 'Ab/cd'
				(parameters.name in get_namespace.hash ? ''
				// {{T}}嵌入[[Template:T]]
				// {{Template:T}}嵌入[[Template:T]]
				// {{:T}}嵌入[[T]]
				// {{Wikipedia:T}}嵌入[[Wikipedia:T]]
				: 'Template:') + parameters[0].toString());

				parameters.name = normalize_page_name(parameters[0].toString());
			}
			parameters.parameters = _parameters;
			parameters.index_of = parameter_index_of;

			_set_wiki_type(parameters, 'transclusion');
			queue.push(parameters);
			// TODO: parameters.parameters = []
			return previous + include_mark + (queue.length - 1) + end_mark;
		}

		// ------------------------------------------------------------------------
		// parse sequence start / start parse

		// parse 範圍基本上由小到大。
		// e.g., transclusion 不能包括 table，因此在 table 前。

		// 得先處理完有開闔的標示法，之後才是單一標示。
		// e.g., "<pre>\n==t==\nw\n</pre>" 不應解析出 section_title。

		// 可順便作正規化/維護清理/修正明顯破壞/修正維基語法/維基化，
		// 例如修復章節標題 (section title, 節タイトル) 前後 level 不一，
		// table "|-" 未起新行等。

		// ----------------------------------------------------
		// comments: <!-- ... -->

		// TODO: <nowiki> 之優先度更高！置於 <nowiki> 中，
		// 如 "<nowiki><!-- --></nowiki>" 則雖無功用，但會當作一般文字顯示，而非註解。

		// "<\": for Eclipse JSDoc.
		if (initialized_fix) {
			// 因為前後標記間所有內容無作用、能置於任何地方（除了 <nowiki> 中，"<no<!-- -->wiki>"
			// 之類），又無需向前回溯；只需在第一次檢測，不會有遺珠之憾。
			wikitext = wikitext.replace(/<\!--([\s\S]*?)-->/g,
					function(all, parameters) {
						// 不再作 parse。
						queue.push(_set_wiki_type(parameters, 'comment'));
						return include_mark + (queue.length - 1) + end_mark;
					})
			// 缺 end mark
			.replace(/<\!--([\s\S]*)$/g, function(all, parameters) {
				// 不再作 parse。
				if (initialized_fix[1]) {
					parameters = parameters.slice(0,
					//
					-initialized_fix[1].length);
					initialized_fix[1] = '';
				}
				parameters = _set_wiki_type(parameters, 'comment');
				if (!normalize)
					parameters.no_end = true;
				queue.push(parameters);
				return include_mark + (queue.length - 1) + end_mark;
			});
		}

		// ----------------------------------------------------
		// 因為<nowiki>可以打斷其他的語法，因此必須要先處理。

		wikitext = wikitext.replace_till_stable(PATTERN_WIKI_TAG_of_nowiki,
				parse_HTML_tag);

		// ----------------------------------------------------

		// 為了 "{{Tl|a<ref>[http://a.a.a b|c {{!}} {{CURRENTHOUR}}]</ref>}}"，
		// 將 -{}-, [], [[]] 等，所有中間可穿插 "|" 的置於 {{{}}}, {{}} 前。

		// ----------------------------------------------------
		// language conversion -{}- 以後來使用的為主。
		// TODO: -{R|里}-
		// 注意: 有些 wiki，例如 jawiki，並沒有開啟 language conversion。
		// [[w:zh:H:Convert]], [[mw:Help:Magic words]]
		// {{Cite web}}漢字不被轉換: 可以使用script-title=ja:。
		// TODO: 使用魔術字 __NOTC__ 或 __NOTITLECONVERT__ 可避免標題轉換。
		// TODO: <source></source>內之-{}-無效。
		wikitext = wikitext.replace_till_stable(/-{(.*?)}-/g, function(all,
				parameters) {
			// -{...}- 自 end_mark 向前回溯。
			var index = parameters.lastIndexOf('-{'), previous;
			if (index > 0) {
				previous = '-{' + parameters.slice(0, index);
				parameters = parameters.slice(index + '}-'.length);
			} else {
				previous = '';
			}
			library_namespace.debug(previous + ' + ' + parameters, 4,
					'parse_wikitext.convert');

			// console.log(parameters);

			var conversion = Object.create(null),
			//
			conversion_list = [], latest_language;

			// console.log('parameters: ' + JSON.stringify(parameters));
			parameters = parameters.split(';');
			parameters.forEach(function(converted, index) {
				if (PATTERN_conversion.test(converted)
				// e.g., "-{ a; zh-tw: tw }-" 之 " a"
				|| conversion_list.length === 0
				// 最後一個是空白。
				|| !converted.trim() && index + 1 === parameters.length) {
					conversion_list.push(converted);
				} else {
					conversion_list[conversion_list.length - 1]
					// e.g., "-{zh-tw: tw ; tw : tw2}-"
					+= ';' + converted;
				}
			});
			// console.log(conversion_list);
			conversion_list = conversion_list.map(function(token) {
				var matched = token.match(PATTERN_conversion);
				if (!matched) {
					// 經過改變，需再進一步處理。
					return parse_wikitext(token, options, queue);
				}

				matched = matched.slice(1);
				// matched: [ leading spaces,
				// this language code, colon, this language token, last spaces ]
				if (!matched[4])
					matched.pop();
				conversion[matched[1]] = matched[3]
				// 經過改變，需再進一步處理。
				= parse_wikitext(matched[3], options, queue);
				if (!matched[0])
					matched.shift();
				token = _set_wiki_type(matched, 'plain');
				token.is_conversion = true;
				return token;
			});
			// console.log(conversion_list);
			parameters = _set_wiki_type(conversion_list, 'convert');
			parameters.conversion = conversion;

			if (queue.switches && (queue.switches.__NOCC__
			// 使用魔術字 __NOCC__ 或 __NOCONTENTCONVERT__ 可避免轉換。
			|| queue.switches.__NOCONTENTCONVERT__)) {
				parameters.no_convert = true;
			} else if (Object.keys(conversion).length === 0) {
				// assert: parameters.length === 1
				// e.g., "-{ t {{T}} }-"
				// NOT "-{ zh-tw: tw {{T}} }-"
				parameters.converted = parameters[0];
			} else if (options && options.language) {
				// TODO: 先檢測當前使用的語言，然後轉成在當前環境下轉換過、會顯示出的結果。
				parameters.converted = parameters.toString(options.language);
			}

			queue.push(parameters);
			return previous + include_mark + (queue.length - 1) + end_mark;
		});

		// ----------------------------------------------------
		// wikilink
		// [[~:~|~]], [[~:~:~|~]]

		// 須注意: [[p|\nt]] 可，但 [[p\n|t]] 不可！

		// 注意: [[p|{{tl|t}}]] 不會被解析成 wikilink，因此 wikilink 應該要擺在 transclusion
		// 前面檢查，或是使 displayed_text 不包含 {{}}。

		// 但注意: "[[File:title.jpg|thumb|a{{tl|t}}|param\n=123|{{tl|t}}]]"
		// 可以解析成圖片, Caption: "{{tl|t}}"

		// TODO: bug: 正常情況下 "[[ ]]" 不會被 parse，但是本函數還是會 parse 成 link。
		// TODO: [[::zh:title]] would be rendered as plaintext

		wikitext = wikitext.replace_till_stable(
		// or use ((PATTERN_link))
		PATTERN_wikilink_global, function(all_link, page_and_section,
				page_name, section_title, displayed_text) {
			// 自 end_mark 向前回溯。
			var previous;
			if (displayed_text && displayed_text.includes('[[')) {
				var index = all_link.lastIndexOf('[[');
				previous = all_link.slice(0, index);
				all_link = all_link.slice(index);
				if (index = all_link.match(PATTERN_wikilink)) {
					page_and_section = index[1];
					page_name = index[2];
					section_title = index[3];
					displayed_text = index[4];
				} else {
					// revert
					all_link = previous + all_link;
					previous = '';
				}
			} else {
				previous = '';
			}
			library_namespace.debug(previous + ' + ' + all_link, 4,
					'parse_wikitext.link');

			var file_matched, category_matched;
			if (!page_name) {
				// assert: [[#section_title]]
				page_name = '';
				section_title = page_and_section;
			} else {
				if (!section_title) {
					section_title = '';
				}
				if (normalize) {
					page_name = page_name.trim();
				}
				// test [[file:name|...|...]]
				file_matched = page_name.match(PATTERN_file_prefix);
				if (!file_matched) {
					category_matched = page_name
					// test [[Category:name|order]]
					.match(PATTERN_category_prefix);
				}
				if (page_name.includes(include_mark)) {
					// 預防有特殊 elements 置入link其中。
					page_name = parse_wikitext(page_name, options, queue);
					page_name.oddly = true;
				} else {
					// TODO: normalize 對 [[文章名稱 : 次名稱]] 可能出現問題。
					page_name = page_name.split(normalize ? /\s*:\s*/ : ':');
				}
				page_name = _set_wiki_type(page_name, 'namespace');
			}
			if (normalize) {
				// assert: section_title && section_title.startsWith('#')
				section_title = section_title.trimEnd();
			}
			if (section_title) {
				// 經過改變，需再進一步處理。
				// e.g., '[[t#-{c}-]]'
				section_title = parse_wikitext(section_title, options, queue);
			}

			// [ page_name, section_title, displayed_text ]
			var parameters = [ page_name, section_title ];

			// assert: 'a'.match(/(b)?/)[1]===undefined
			if (typeof displayed_text === 'string') {
				if (file_matched) {
					// caption 可以放在中間，但即使是空白也會被認作是 caption:
					// ;;; [[File:a.svg|caption|thumb]]
					// === [[File:a.svg|thumb|caption]]
					// !== [[File:a.svg|NG caption|thumb|]]
					// === [[File:a.svg|thumb|NG caption|]]

					// 先處理掉裏面的功能性代碼。 e.g.,
					// [[File:a.svg|alt=alt_of_{{tl|t}}|NG_caption|gykvg=56789{{tl|t}}|{{#ifexist:abc|alt|link}}=abc|{{#ifexist:abc|left|456}}|{{#expr:100+300}}px|thumb]]
					// e.g., [[File:a.svg|''a''|caption]]
					displayed_text = parse_wikitext(displayed_text, {
						no_resolve : true
					}, queue);

					// [ file namespace, section_title,
					// parameters 1, parameters 2, parameters..., caption ]
					var token, file_option,
					// parameters 有分大小寫，並且各種類會以首先符合的為主。
					PATTERN = /([^\|]*?)(\||$)/ig;
					// assert: 這會將剩下來的全部分完。
					while (token = PATTERN.exec(displayed_text)) {
						var matched = token[1].match(
						// [ all, head space, option name or value, undefined,
						// undefined, tail space ]
						// or
						// [ all, head space, option name, "="+space, value,
						// tail space ]
						/^([\s\n]*)([^={}\[\]<>\s\n][^={}\[\]<>]*?)(?:(=[\s\n]*)([\s\S]*?))?([\s\n]*)$/
						// TODO: 經測試，link等號前方不可有空格，alt等號前方可有空格。必須用小寫的"alt"。
						// 現在的處理方法只允許等號前面不可有空格。
						// 檔案選項名稱可以在地化，不一定都是 [a-z]。
						);
						if (!matched) {
							// e.g., " a<br/>b "
							matched = token[1]
									.match(/^([\s\n]*)([\s\S]*?)([\s\n]*)$/);
							if (matched[1] || matched[3]) {
								// image_description
								parameters.caption
								// 相當於 .trim()
								= matched[2] = parse_wikitext(matched[2],
										options, queue);
								if (!matched[3])
									matched.pop();
								matched.shift();
								if (!matched[0])
									matched.shift();
								_set_wiki_type(matched, 'plain');
							} else {
								parameters.caption
								// assert: 前後都沒有空白。
								= matched = parse_wikitext(token[1], options,
										queue);
							}
							parameters.push(matched);
							if (!token[2]) {
								break;
							}
							continue;
						}

						// 除了 alt, caption 外，這些 option tokens 不應包含功能性代碼。

						matched[2]
						//
						= parse_wikitext(matched[2], options, queue);

						// has equal sign "="
						var has_equal = typeof matched[4] === 'string';
						if (has_equal) {
							// e.g., |alt=text|
							matched[4] = parse_wikitext(matched[4], options,
									queue);
							// [ head space, option name, "="+space, value,
							// tail space ]
							file_option = matched.slice(1);
						} else {
							// e.g., |right|
							// [ head space, option name or value, tail space ]
							file_option = [ matched[1],
							//
							matched[2], matched[5] ];
						}
						file_option = _set_wiki_type(file_option, 'plain');

						// 'right' of |right|, 'alt' of |alt=foo|
						var option_name = file_option[1],
						//
						option_value = has_equal && file_option[3];

						// reduce
						while (!file_option[0]) {
							file_option.shift();
						}
						while (!file_option[file_option.length - 1]) {
							file_option.pop();
						}
						if (file_option.length === 1) {
							file_option = file_option[0];
						}

						// console.log('-'.repeat(80)+64545646);
						// console.log(has_equal);
						// console.log(file_option);
						parameters.push(file_option);

						// 各參數設定。
						if (!has_equal && (option_name in file_options)) {
							if (!parameters[file_options[option_name]]
							// 'location' 等先到先得。
							|| file_options[option_name] !== 'location'
							// Type, display format
							&& file_options[option_name] !== 'format') {
								parameters[file_options[option_name]]
								//
								= option_name;
							}

						} else if (!has_equal
						//
						&& /^(?:(?:\d+)?x)?\d+ *px$/.test(option_name)) {
							// 以後到的為準。
							parameters.size = option_name;

						} else if (has_equal
								// 這些選項必須有 "="。無 "=" 的話，會被當作 caption。
								&&
								// page: DjVuファイルの場合、 page="ページ番号"で開始ページを指定できます。
								/^(?:link|alt|lang|page|thumbtime|start|end|class)$/
										.test(option_name)) {
							// 以後到的為準。
							parameters[option_name] = option_value;

						} else if (has_equal
								&& /^(?:thumb|thumbnail|upright)$/
										.test(option_name)) {
							// 以後到的為準。
							// upright=1 →
							// parameters.size='upright'
							// parameters.upright='1'
							parameters[file_options
							//
							[option_name]] = option_name;
							parameters[option_name] = option_value;

						} else if (has_equal) {
							// 即使是空白也會被認作是 caption。
							// 相當於 .trim()
							if (typeof option_name === 'string'
									&& typeof option_value === 'string') {
								parameters.caption = option_name + '='
										+ option_value;
							} else {
								parameters.caption = [ option_name, '=',
										option_value ];
								parameters.caption
								//
								.toString = file_option.toString;
							}

						} else {
							// 相當於 .trim()
							parameters.caption = option_name;
						}

						if (!token[2]) {
							break;
						}
					}

				} else {
					// 需再進一步處理 {{}}, -{}- 之類。
					parameters.caption = parse_wikitext(displayed_text,
							options, queue);
					parameters.push(parameters.caption);
				}
			}
			if (file_matched || category_matched) {
				// shown by link, is a linking to a file
				// e.g., token[0][0].trim() === "File"; token[0]: namespace
				parameters.is_link = page_name[0].trim() === '';

				if (file_matched) {
					// set File name
					parameters.name = normalize_page_name(file_matched[1]);
				} else if (category_matched) {
					// set Category name
					parameters.name = normalize_page_name(category_matched[1]);
				}
			} else {
				parameters.is_link = true;
			}
			// TODO: [[Special:]]
			// TODO: [[Media:]]: 連結到圖片但不顯示圖片
			_set_wiki_type(parameters, file_matched ? 'file'
					: category_matched ? 'category' : 'link');
			// [ page_name, section_title, displayed_text without '|' ]
			// section_title && section_title.startsWith('#')
			queue.push(parameters);
			return previous + include_mark + (queue.length - 1) + end_mark;
		});

		// ----------------------------------------------------
		// external link
		// [http://... ...]
		// TODO: [{{}} ...]
		wikitext = wikitext.replace_till_stable(PATTERN_external_link_global,
		//
		function(all, URL, delimiter, parameters) {
			URL = [ URL.includes(include_mark)
			// 預防有特殊 elements 置入其中。此時將之當作普通 element 看待。
			? parse_wikitext(URL, options, queue)
			// 以 token[0].toString() 取得 URL。
			: _set_wiki_type(URL, 'url') ];
			if (delimiter) {
				if (normalize) {
					parameters = parameters.trim();
				} else {
					// 紀錄 delimiter，否則 .toString() 時 .join() 後會與原先不同。
					if (delimiter !== ' ')
						URL.delimiter = delimiter;
					// parameters 已去除最前面的 delimiter (space)。
				}
				// 經過改變，需再進一步處理。
				URL.push(parse_wikitext(parameters, options, queue));
			}
			_set_wiki_type(URL, 'external_link');
			queue.push(URL);
			return include_mark + (queue.length - 1) + end_mark;
		});

		// ----------------------------------------------------
		// {{{...}}} 需在 {{...}} 之前解析。
		// [[w:zh:Help:模板]]
		// 在模板頁面中，用三個大括弧可以讀取參數。
		// MediaWiki 會把{{{{{{XYZ}}}}}}解析為{{{ {{{XYZ}}} }}}而不是{{ {{ {{XYZ}} }} }}
		wikitext = wikitext.replace_till_stable(
		//
		/{{{([^{}][\s\S]*?)}}}/g, function parse_parameters(all, parameters) {
			// 自 end_mark 向前回溯。
			var index = parameters.lastIndexOf('{{{'), previous;
			if (index > 0) {
				previous = '{{{' + parameters.slice(0, index);
				parameters = parameters.slice(index + '}}}'.length);
			} else {
				previous = '';
			}
			library_namespace.debug(previous + ' + ' + parameters, 4,
					'parse_wikitext.parameter');

			parameters = parameters.split('|');
			parameters = parameters.map(function(token, index) {
				return index === 0
				// 預防有特殊 elements 置入其中。此時將之當作普通 element 看待。
				&& !token.includes(include_mark)
				//
				? _set_wiki_type(
				//
				token.split(normalize ? /\s*:\s*/ : ':'), 'page_title')
				// 經過改變，需再進一步處理。
				: parse_wikitext(token, options, queue);
			});
			_set_wiki_type(parameters, 'parameter');
			queue.push(parameters);
			return previous + include_mark + (queue.length - 1) + end_mark;
		});

		// ----------------------------------------------------
		// 模板（英語：Template，又譯作「樣板」、「範本」）
		// {{Template name|}}
		wikitext = wikitext.replace_till_stable(
		//
		PATTERN_for_transclusion, parse_transclusion);

		// ----------------------------------------------------

		// 由於 <tag>... 可能被 {{Template}} 截斷，因此先處理 {{Template}} 再處理 <t></t>。
		// 先處理 <t></t> 再處理 <t/>，預防單獨的 <t> 被先處理了。

		// ----------------------------------------------------
		// [[Help:HTML in wikitext]]

		// <s>不採用 global variable，預防 multitasking 並行處理。</s>
		// reset PATTERN index
		// PATTERN_WIKI_TAG.lastIndex = 0;

		// console.log(PATTERN_TAG);
		// console.log(wikitext);

		// HTML tags that must be closed.
		// <pre>...</pre>, <code>int f()</code>
		wikitext = wikitext.replace_till_stable(
				PATTERN_WIKI_TAG_without_nowiki, parse_HTML_tag);

		// ----------------------------------------------------
		// single tags. e.g., <hr />
		// TODO: <nowiki /> 能斷開如 [[L<nowiki />L]]

		// reset PATTERN index
		// PATTERN_WIKI_TAG_VOID.lastIndex = 0;

		// assert: 有 end tag 的皆已處理完畢，到這邊的是已經沒有 end tag 的。
		wikitext = wikitext.replace_till_stable(PATTERN_WIKI_TAG_VOID,
				parse_single_tag);
		// 處理有明確標示為 simgle tag 的。
		// 但 MediaWiki 現在會將 <b /> 轉成 <b>，因此不再處理這部分。
		if (false) {
			wikitext = wikitext.replace_till_stable(
					/<([a-z]+)(\s[^<>]*\/)?>/ig, parse_single_tag);
		}

		// ----------------------------------------------------
		// table: \n{| ... \n|}
		// 因為 table 中較可能包含 {{Template}}，但 {{Template}} 少包含 table，
		// 因此先處理 {{Template}} 再處理 table。
		// {|表示表格開始，|}表示表格結束。
		wikitext = wikitext.replace_till_stable(
		// [[Help:Table]]
		/\n{\|([\s\S]*?)\n\|}/g, function(all, parameters) {
			// 經測試，table 不會向前回溯。

			// 處理表格標題。
			function get_caption(caption) {
				// .toString(): 可能會包括 include_mark, end_mark，應去除之！
				return caption.toString().trim();
			}

			var main_caption;
			parameters = parameters.replace(/\n\|\+(.*)/g, function(all,
					caption) {
				// '||': 應採用 /\n(?:\|\|?|!)|\|\||!!/
				caption = caption.split('||').map(function(piece) {
					return parse_wikitext(piece, options, queue);
				});
				if (main_caption === undefined) {
					// 表格標題以首次出現的為主。
					// console.log(caption);
					main_caption = get_caption(caption.join(''));
				}
				// 'table_caption'
				caption = _set_wiki_type(caption, 'caption');
				queue.push(caption);
				return include_mark + (queue.length - 1) + end_mark;
			});

			// 添加新行由一個豎線和連字符 "|-" 組成。
			parameters = parameters.split('\n|-').map(function(token, index) {
				library_namespace.debug('parse table_row / row style: '
				//
				+ JSON.stringify(token), 5, 'parse_wikitext.table');
				if (index === 0
				// 預防有特殊 elements 置入其中。此時將之當作普通 element 看待。
				&& !token.includes(include_mark)
				// 含有 delimiter 的話，即使位在 "{|" 之後，依舊會被當作 row。
				&& !/\n[!|]|!!|\|\|/.test(token)) {
					// table style / format modifier (not displayed)
					// "\n|-" 後面的 string
					token = _set_wiki_type(token, 'table_style');
					if (false && index === 0)
						token = _set_wiki_type(token, 'table_row');
					return token;
				}

				var row, matched, delimiter,
				// 分隔 <td>, <th>
				// matched: [ all, inner, delimiter ]
				// 必須有實體才能如預期作 .exec()。
				// "\n|| t" === "\n| t"
				PATTERN_CELL = /([\s\S]*?)(\n(?:\|\|?|!)|\|\||!!|$)/g;
				while (matched = PATTERN_CELL.exec(token)) {
					library_namespace.debug('parse table_cell: '
					//
					+ JSON.stringify(matched), 5, 'parse_wikitext.table');
					// console.log(matched);
					if (matched[2].length === 3 && matched[2].charAt(2)
					// e.g., "\n||| t"
					=== token.charAt(PATTERN_CELL.lastIndex)) {
						// 此時 matched 須回退 1字元。
						matched[2] = matched[2].slice(0, -1);
						PATTERN_CELL.lastIndex--;
					}
					// "|-" 應當緊接著 style，可以是否設定過 row 判斷。
					// 但若這段有 /[<>]/ 則當作是內容。
					if (row || /[<>]/.test(matched[1])) {
						var cell = matched[1].match(/^([^|]+)(\|)([\s\S]*)$/);
						if (cell) {
							// TODO: data-sort-type in table head

							var data_type = cell[1]
							// @see
							// [[w:en:Help:Sorting#Configuring the sorting]]
							// [[w:en:Help:Sorting#Specifying_a_sort_key_for_a_cell]]
							.match(/data-sort-type=(["']([^"']+)["']|[^\s]+)/);

							if (cell[1].includes(include_mark)) {
								cell[1] = [
								// 預防有特殊 elements 置入其中。此時將之當作普通 element 看待。
								parse_wikitext(cell[1], options, queue) ];
							}
							cell[1] = _set_wiki_type(cell[1],
							// cell style / format modifier (not displayed)
							'table_style');
							// assert: cell[2] === '|'
							cell[1].push(cell[2]);

							cell[3] = parse_wikitext(cell[3], options, queue);
							if (data_type) {
								data_type = data_type[1] || data_type[2];
								if (typeof data_type === 'number') {
									data_type = +cell[3];
									if (!isNaN(data_type)) {
										// cell[3] = data_type;
									}
								} else if (typeof data_type === 'isoDate') {
									data_type = Date.parse(cell[3]);
									if (!isNaN(data_type)) {
										// cell[3] = new Date(data_type);
									}
								}
							}

							cell = [ cell[1], cell[3] ];
						} else {
							// 經過改變，需再進一步處理。
							cell = parse_wikitext(matched[1], options, queue);
							if (cell.type !== 'plain') {
								// {String} or other elements
								cell = [ cell ];
							}
						}

						_set_wiki_type(cell, 'table_cell');

						if (delimiter) {
							cell.delimiter = delimiter;
							// is_header
							cell.is_head = delimiter.startsWith('\n')
							// TODO: .is_head, .table_type 擇一。
							? delimiter.endsWith('!') : row.is_head;
							// is cell <th> or <td> ?
							cell.table_type = cell.is_head ? 'th' : 'td';
						}

						if (!row)
							row = [];
						row.push(cell);

					} else {
						// assert: matched.index === 0
						if (matched[1].includes(include_mark)) {
							// 預防有特殊 elements 置入其中。此時將之當作普通 element 看待。
							// 注意: caption 也被當作 table_row 看待。
							cell = parse_wikitext(matched[1], options, queue);
							// console.trace('cell:');
							// console.log(cell);
							if (cell.type === 'plain' && cell[cell.length - 1]
							//
							&& cell[cell.length - 1].type === 'caption') {
								var caption = cell.pop();
								row = [
								// the style of whole <table>
								_set_wiki_type(cell, 'table_style'),
								//
								caption ];
								row.caption = get_caption(caption.join(''));
							} else {
								row = [ cell ];
								if (cell.type === 'caption') {
									row.caption = get_caption(cell.join(''));
								}
							}

						} else {
							cell = _set_wiki_type(matched[1],
							// row style / format modifier (not displayed)
							'table_style');
							row = [ cell ];
						}
					}

					// matched[2] 屬於下一 cell。
					delimiter = matched[2];
					if (!delimiter) {
						// assert: /$/, no separator, ended.
						break;
					}

					// assert: !!delimiter === true, and is the first time
					// matched.
					if (!('is_head' in row)
					// 初始設定本行之 type: <th> or <td>。
					&& !(row.is_head = delimiter.includes('!'))) {
						// 經測試，當此行非 table head 時，會省略 '!!' 不匹配。
						// 但 '\n!' 仍有作用。
						var lastIndex = PATTERN_CELL.lastIndex;
						// console.log("省略 '!!' 不匹配: " +
						// token.slice(lastIndex));
						PATTERN_CELL = /([\s\S]*?)(\n(?:\|\|?|!)|\|\||$)/g;
						PATTERN_CELL.lastIndex = lastIndex;
					}
				}
				// assert: Array.isArray(row)
				return _set_wiki_type(row, 'table_row');
			});

			_set_wiki_type(parameters, 'table');
			if (main_caption !== undefined)
				parameters.caption = main_caption;
			queue.push(parameters);
			// 因為 "\n" 在 wikitext 中為重要標記，因此 restore 之。
			return '\n' + include_mark + (queue.length - 1) + end_mark;
		});

		// ----------------------------------------------------

		wikitext = wikitext.replace(PATTERN_BEHAVIOR_SWITCH, function(all,
				switch_word) {
			var parameters = _set_wiki_type(switch_word, 'switch');
			if (!queue.switches) {
				queue.switches = Object.create(null);
			}
			if (!queue.switches[switch_word]) {
				queue.switches[switch_word] = [ parameters ];
			} else {
				// 照理來說通常不應該要有多個 switches...
				queue.switches[switch_word].push(parameters);
			}
			queue.push(parameters);
			return include_mark + (queue.length - 1) + end_mark;
		});

		function apostrophe_type(all, type, parameters) {
			// console.log([ all, type, parameters ]);
			var index = parameters.lastIndexOf(type), previous = '';
			if (index !== NOT_FOUND) {
				previous = type + parameters.slice(0, index);
				parameters = parameters.slice(index + type.length);
			}
			// 預防有特殊 elements 置入其中。此時將之當作普通 element 看待。
			parameters = parse_wikitext(parameters, options, queue);
			// 注意: parameters.length 可能大於1
			parameters = _set_wiki_type(parameters, type === "''" ? 'italic'
					: 'bold');
			queue.push(parameters);
			return previous + include_mark + (queue.length - 1) + end_mark;
		}

		// 若是要處理<b>, <i>這兩項，也必須調整 section_link()。

		// ''''b''''' → <i><b>b</b></i>
		// 因此先從<b>開始找。

		// '''~''' 不能跨行！ 注意: '''{{font color}}''', '''{{tsl}}'''
		wikitext = wikitext.replace_till_stable(/(''')([^'\n].*?)\1/g,
				apostrophe_type);
		// ''~'' 不能跨行！
		wikitext = wikitext.replace_till_stable(/('')([^'\n].*?)\1/g,
				apostrophe_type);
		// '', ''' 似乎會經過微調: [[n:zh:Special:Permalink/120676]]

		// ~~~, ~~~~, ~~~~~: 不應該出現

		// ----------------------------------------------------
		// parse_wikitext.section_title

		// TODO: 經測試，"\n== <code>code<code> =="會被當作title，但採用本函數將會解析錯誤。
		// [[w:zh:Special:Diff/46814116]]

		// postfix 沒用 \s，是因為 node 中， /\s/.test('\n')，且全形空白之類的確實不能用在這。
		wikitext = wikitext.replace_till_stable(
		// @see PATTERN_section
		/(^|\n)(=+)(.+)\2([ \t]*)(\n|$)/g, function(all, previous,
				section_level, parameters, postfix, last) {
			// console.log('==> ' + JSON.stringify(all));
			if (normalize) {
				parameters = parameters.trim();
			}
			// 經過改變，需再進一步處理。
			parameters = parse_wikitext(parameters, options, queue);
			if (parameters.type !== 'plain') {
				parameters = [ parameters ];
			}
			parameters = _set_wiki_type(parameters, 'section_title');

			// Use plain section_title instead of title with wikitext.
			// 因為尚未resolve_escaped()，直接使用未parse_wikitext()者會包含未解碼之code!
			// parameters.title = parameters.toString().trim();
			parameters.link = section_link(parameters.toString(),
			// for options.language
			options);
			/** {String}section title in wikitext */
			parameters.title = parameters.link.id;

			if (postfix && !normalize)
				parameters.postfix = postfix;
			parameters.level = section_level.length;
			queue.push(parameters);
			// 因為 "\n" 在 wikitext 中為重要標記，因此 restore 之。
			return previous + include_mark + (queue.length - 1) + end_mark
					+ last;
		});

		// console.log('10: ' + JSON.stringify(wikitext));

		if (false) {
			// another method to parse.
			wikitext = '{{temp|{{temp2|p{a}r{}}}}}';
			pattern = /{{[\s\n]*([^\s\n#\|{}<>\[\]][^#\|{}<>\[\]]*)/g;
			matched = pattern.exec(wikitext);
			end_index = wikitext.indexOf('}}', pattern.lastIndex);

			PATTERN_wikilink;
		}

		// ----------------------------------------------------
		// 處理 / parse bare / plain URLs in wikitext: https:// @ wikitext
		// @see [[w:en:Help:Link#Http: and https:]]

		// console.log('11: ' + JSON.stringify(wikitext));

		// 在 transclusion 中不會被當作 bare / plain URL。
		if (!options || !options.inside_transclusion) {
			wikitext = wikitext.replace(PATTERN_URL_WITH_PROTOCOL_GLOBAL,
			//
			function(all, previous, URL) {
				all = _set_wiki_type(URL, 'url');
				// 須注意:此裸露 URL 之 type 與 external link 內之type相同！
				// 因此需要測試 token.is_bare 以確定是否在 external link 內。
				all.is_bare = true;
				queue.push(all);
				return previous + include_mark + (queue.length - 1) + end_mark;
			});
		}

		// ----------------------------------------------------
		// 處理 / parse list @ wikitext
		// @see [[w:en:MOS:LIST]], [[w:en:Help:Wikitext#Lists]]
		// 注意: 這裡僅處理在原wikitext中明確指示列表的情況，無法處理以模板型式表現的列表。

		// 列表層級。 e.g., ['#','*','#',':']
		var list_prefixes_now = [], list_now = [],
		//
		lines_without_style = [],
		//
		list_conversion = {
			';' : DEFINITION_LIST,
			':' : DEFINITION_LIST
		};

		function parse_list_line(line) {
			var index = 0, position = 0;
			while (index < list_prefixes_now.length
			// 確認本行與上一行有多少相同的列表層級。
			&& list_prefixes_now[index] ===
			//
			(list_conversion[line.charAt(position)] || line.charAt(position))) {
				// position += list_prefixes_now[index++].length;
				index++;
				position++;
			}

			// console.log(list_now);
			list_prefixes_now.truncate(position);
			list_now.truncate(position);

			var prefix,
			// is <dt>
			is_dt,
			// latest_list === list_now[list_now.length - 1]
			latest_list = list_now[position - 1],
			// 尋找從本行開始的新列表。
			matched = line.slice(position).match(/^([*#;:]+)(\s*)(.*)$/);
			if (!matched) {
				if (position > 0) {
					// console.log([ position, line ]);
					var prefix = line.slice(0, position);
					is_dt = prefix.endsWith(';');
					line = line.slice(position);
					matched = line.match(/^\s+/);
					if (matched) {
						// 將空白字元放在 .list_prefix 可以減少很多麻煩。
						prefix += matched[0];
						line = line.slice(matched[0].length);
					}
					// '\n': from `wikitext.split('\n')`
					latest_list.list_prefix.push('\n' + prefix);

					if (is_dt) {
						latest_list.dt_index.push(latest_list.length);

						// search "; title : definition"
						if (matched = line.match(/^(.*)(:\s*)(.*)$/)) {
							latest_list.push(
							// 經過改變，需再進一步處理。
							parse_wikitext(matched[1], options, queue));
							// 將空白字元放在 .list_prefix 可以減少很多麻煩。
							latest_list.list_prefix.push(matched[2]);
							line = matched[3];
						}
					}

					latest_list.push(
					// 經過改變，需再進一步處理。
					parse_wikitext(line, options, queue));
				} else {
					// 非列表。
					// assert: position === -1
					lines_without_style.push(line.slice(position));
				}
				return;
			}

			if (position > 0) {
				prefix = line.slice(0, position);
				// '\n': from `wikitext.split('\n')`
				latest_list.list_prefix.push('\n' + prefix);
				if (prefix.endsWith(';')) {
					latest_list.dt_index.push(latest_list.length);
				}
			}

			var list_symbols = matched[1].split('');
			line = matched[3];
			list_symbols.forEach(function handle_list_item(list_type) {
				// 處理多層選單。
				var list = _set_wiki_type([], 'list');
				// .list_prefix: for ";#a\n:#b"
				list.list_prefix = [ list_type ];
				// 注意: 在以 API 取得頁面列表時，也會設定 pages.list_type。
				list.list_type = list_type = list_conversion[list_type]
						|| list_type;
				if (list.list_type === DEFINITION_LIST) {
					// list[list.dt_index[NO]] 為 ";"。
					list.dt_index = [];
				}
				// .get_item_prefix() 會回溯 parent list，使得節點搬動時也能夠顯示出正確的前綴。
				// 然而這不能應付像 ";#a\n:#b" 這樣子的特殊情況，因此最後採用 .list_prefix 的方法。
				// list.get_item_prefix = get_item_prefix;

				if (latest_list) {
					list.index = latest_list.length;
					list.parent = latest_list;
					latest_list.push(list);
				} else {
					queue.push(list);
					lines_without_style.push(
					//
					include_mark + (queue.length - 1) + end_mark);
				}

				latest_list = list;
				list_now.push(list);
				list_prefixes_now.push(list_type);
			});

			is_dt = latest_list.list_prefix[0].endsWith(';');

			// matched[2]: 將空白字元放在 .list_prefix 可以減少很多麻煩。
			latest_list.list_prefix[0] += matched[2];

			// is <dt>, should use: ';' ===
			// latest_list.list_prefix[latest_list.list_prefix.length - 1]
			// assert: latest_list.length === latest_list.list_prefix.length - 1
			if (is_dt) {
				// assert: latest_list.length === 0
				// latest_list.dt_index.push(latest_list.length);
				latest_list.dt_index.push(0);

				// search "; title : definition"
				if (matched = line.match(/^(.*)(:\s*)(.*)$/)) {
					latest_list.push(
					// 經過改變，需再進一步處理。
					parse_wikitext(matched[1], options, queue));
					// 將空白字元放在 .list_prefix 可以減少很多麻煩。
					latest_list.list_prefix.push(matched[2]);
					line = matched[3];
				}
			}

			latest_list.push(
			// 經過改變，需再進一步處理。
			parse_wikitext(line, options, queue));
		}

		// console.log('12: ' + JSON.stringify(wikitext));
		// console.log(queue);

		wikitext = wikitext.split('\n');
		// e.g., for "<b>#ccc</b>"
		var first_line = !initialized_fix && wikitext.shift();

		wikitext.forEach(parse_list_line);
		wikitext = lines_without_style;

		// ----------------------------------------------------
		// parse horizontal rule, line, HTML <hr /> element: ----, -{4,}
		// @see [[w:en:Help:Wikitext#Horizontal rule]]
		// Their use in Wikipedia articles is deprecated.
		// They should never appear in regular article prose.

		function parse_hr_tag(line, index) {
			var matched = line.match(/^(-{4,})(.*)$/);
			if (!matched
			// 例如在模板、link 中，一開始就符合的情況。
			|| index === 0 && !initialized_fix) {
				lines_without_style.push(line);
				return;
			}

			var hr = _set_wiki_type(matched[1], 'hr');

			queue.push(hr);
			lines_without_style.push(include_mark + (queue.length - 1)
					+ end_mark + matched[2]);
		}

		// reset
		lines_without_style = [];

		wikitext.forEach(parse_hr_tag);
		wikitext = lines_without_style;

		// ----------------------------------------------------
		// parse preformatted text, HTML <pre> element: \n + space
		// @seealso [[w:en:Help:Wikitext#Pre]]

		function parse_preformatted(line, index) {
			if (!line.startsWith(' ')
			// 例如在模板、link 中，一開始就符合的情況。
			|| index === 0 && !initialized_fix) {
				if (list_now) {
					// reset
					list_now = null;
				}
				lines_without_style.push(line);
				return;
			}

			// 經過改變，需再進一步處理。
			// 1: ' '.length
			line = parse_wikitext(line.slice(1), options, queue);

			if (list_now) {
				list_now.push(line);
				return;
			}

			list_now = _set_wiki_type([ line ], 'pre');

			queue.push(list_now);
			lines_without_style.push(include_mark + (queue.length - 1)
					+ end_mark);
		}

		// reset
		lines_without_style = [];
		// pre_list
		list_now = null;

		wikitext.forEach(parse_preformatted);
		wikitext = lines_without_style;

		// free
		lines_without_style = null;

		if (!initialized_fix) {
			// recover
			wikitext.unshift(first_line);
		}
		wikitext = wikitext.join('\n');

		// ↑ parse sequence finished *EXCEPT FOR* paragraph
		// ------------------------------------------------------------------------

		// console.log('13: ' + JSON.stringify(wikitext));
		if (options && typeof options.postfix === 'function')
			wikitext = options.postfix(wikitext, queue, include_mark, end_mark)
					|| wikitext;

		// console.log('14: ' + JSON.stringify(wikitext));
		if (initialized_fix) {
			// 去掉初始化時添加的 fix。
			// 須預防有些為完結的標記，把所添加的部分吃掉了。此時不能直接 .slice()，
			// 而應該先檢查是不是有被吃掉的狀況。
			if (initialized_fix[0] || initialized_fix[1])
				wikitext = wikitext.slice(initialized_fix[0].length,
				// assert: '123'.slice(1, undefined) === '23'
				// if use length as initialized_fix[1]:
				// assert: '1'.slice(0, [ 1 ][1]) === '1'
				initialized_fix[1] ? -initialized_fix[1].length : undefined);
		}

		// ----------------------------------------------------
		// MUST be last: 處理段落 / parse paragraph @ wikitext

		// console.log('15: ' + JSON.stringify(wikitext));
		// [ all, text, separator ]
		var PATTERN_paragraph = /([\s\S]*?)((?:\s*\n){2,}|$)/g;
		if (initialized_fix && options && options.parse_paragraph
				&& /\n\s*\n/.test(wikitext)) {
			// 警告: 解析段落的動作可能破壞文件的第一層結構，會使文件的第一層結構以段落為主。
			wikitext = wikitext.replace(PATTERN_paragraph,
			// assert: 這個 pattern 應該能夠完全分割 wikitext。
			function(all, text, separator) {
				if (!all) {
					return '';
				}
				all = text.split('\n');
				// console.log(all);
				// 經過改變，需再進一步處理。
				all = all.map(function(t) {
					return parse_wikitext(t, options, queue);
				});
				// console.log(all);
				all = _set_wiki_type(all, 'paragraph');
				if (separator)
					all.separator = separator;
				// console.log('queue index: ' + queue.length);
				queue.push(all);
				return include_mark + (queue.length - 1) + end_mark;
			});
		}

		// console.log(wikitext);
		if (no_resolve) {
			return wikitext;
		}

		// console.log('16: ' + JSON.stringify(wikitext));
		queue.push(wikitext);
		if (false) {
			console.log('='.repeat(80));
			console.log(queue);
			console.log(JSON.stringify(wikitext));
		}
		resolve_escaped(queue, include_mark, end_mark);

		wikitext = queue[queue.length - 1];
		// console.log(wikitext);
		if (initialized_fix && options && Array.isArray(options.target_array)
				&& Array.isArray(wikitext) && wikitext.type === 'plain') {
			// 可藉以複製必要的屬性。
			// @see function parse_page(options)
			options.target_array.truncate();
			// copy parsed data to .target_array
			Array.prototype.push.apply(options.target_array, wikitext);
			wikitext = options.target_array;
		}

		if (initialized_fix && queue.switches) {
			wikitext.switches = queue.switches;
		}

		// Release memory. 釋放被占用的記憶體.
		queue = null;

		if (initialized_fix && (!options || !options.parse_paragraph)
		// 若是解析模板，那麼添加任何的元素，都可能破壞轉換成字串後的結果。
		// plain: 表示 wikitext 可能是一個頁面。最起碼是以 .join('') 轉換成字串的。
		&& wikitext.type === 'plain') {
			// console.log(wikitext);
			// 純文字分段。僅切割第一層結構。
			for (var index = 0; index < wikitext.length; index++) {
				var token = wikitext[index], matched;
				// console.log('---> [' + index + '] ' + token);
				if (typeof token === 'string') {
					if (!/\n\s*\n/.test(token)) {
						continue;
					}
					// 刪掉原先的文字 token = wikitext[index]。
					wikitext.splice(index, 1);
					// 從這裡開始，index 指的是要插入字串的位置。
					while ((matched = PATTERN_paragraph.exec(token))
							&& matched[0]) {
						// console.log('#1 ' + token);
						// console.log(matched);
						// text, separator 分開，在做 diff 的時候會更容易處理。
						if (matched[1] && matched[2]) {
							wikitext.splice(index, 0, matched[1], matched[2]);
							index += 2;
						} else {
							// assert:
							// case 1: matched[2] === '',
							// matched[0] === matched[1]
							// case 2: matched[1] === '',
							// matched[0] === matched[2]
							wikitext.splice(index++, 0, matched[0]);
						}
					}
					// 回復 index 的位置。
					index--;
					// reset PATTERN index
					PATTERN_paragraph.lastIndex = 0;

				} else {
					// assert: typeof wikitext[index] === 'object'
					if (index > 0
							&& typeof (token = wikitext[index - 1]) === 'string'
							&& (matched = token
									.match(/^([\s\S]*[^\s\n])([\s\n]*\n)$/))) {
						// e.g., ["abc \n","{{t}}"] → ["abc"," \n","{{t}}"]
						// console.log('#2 ' + token);
						// console.log(matched);
						// text, space 分開，在做 diff 的時候會更容易處理。
						wikitext.splice(index - 1, 1, matched[1], matched[2]);
						index++;
					}
					token = wikitext[index + 1];
					// console.log('>>> ' + token);
					if (typeof token === 'string'
							&& (matched = token.match(/^(\n+)([^\n][\s\S]*?)$/))) {
						// e.g., ["{{t}}","\nabc"] → ["{{t}}","\n","abc"]
						// console.log('#3 ' + token);
						// console.log(matched);
						// text, space 分開，在做 diff 的時候會更容易處理。
						wikitext.splice(index + 1, 1, matched[1], matched[2]);
					}
				}
			}
		}

		if (false) {
			library_namespace.debug('set depth ' + (depth_of_children - 1)
					+ ' to node [' + wikitext + ']', 3, 'parse_wikitext');
			wikitext[KEY_DEPTH] = depth_of_children - 1;
		}

		return wikitext;
	}

	// ------------------------------------------------------------------------

	// 模板名#後的內容會忽略。
	// matched: [ , Template name ]
	var TEMPLATE_NAME_PATTERN = /{{[\s\n]*([^\s\n#\|{}<>\[\]][^#\|{}<>\[\]]*)[|}]/,
	//
	TEMPLATE_START_PATTERN = new RegExp(TEMPLATE_NAME_PATTERN.source.replace(
			/\[[^\[]+$/, ''), 'g'),
	/** {RegExp}內部連結 PATTERN */
	LINK_NAME_PATTERN = /\[\[[\s\n]*([^\s\n\|{}<>\[\]�][^\|{}<>\[\]]*)(\||\]\])/;

	/**
	 * parse template token. 取得完整的模板 token。<br />
	 * CeL.wiki.parse.template();
	 * 
	 * TODO:<br />
	 * {{link-en|{{convert|198|cuin|L|abbr=on}} ''斜置-6'' 198|Chrysler Slant 6
	 * engine#198}}
	 * 
	 * @param {String}wikitext
	 *            模板前後之 content。<br />
	 *            assert: wikitext 為良好結構 (well-constructed)。
	 * @param {String|Array}[template_name]
	 *            擷取模板名 template name。
	 * @param {Number}[parse_type]
	 *            1: [ {String}模板名, parameters ]<br />
	 *            true: 不解析 parameters。<br />
	 *            false: 解析 parameters。
	 * 
	 * @returns {Undefine}wikitext 不包含此模板。
	 * @returns {Array}token = [ {String}完整的模板 wikitext token, {String}模板名,
	 *          {Array}parameters ];<br />
	 *          token.count = count('{{') - count('}}')，正常情況下應為 0。<br />
	 *          token.index, token.lastIndex: index.<br />
	 *          parameters[0] is {{{1}}}, parameters[1] is {{{2}}}, ...<br />
	 *          parameters[p] is {{{p}}}
	 */
	function parse_template(wikitext, template_name, parse_type) {
		template_name = normalize_name_pattern(template_name, true, true);
		var matched = template_name
		// 模板起始。
		? new RegExp(/{{[\s\n]*/.source + template_name + '\\s*[|}]', 'ig')
				: new RegExp(TEMPLATE_NAME_PATTERN.source, 'g');
		library_namespace.debug('Use pattern: ' + matched, 3, 'parse_template');
		// template_name : start token
		template_name = matched.exec(wikitext);

		if (!template_name) {
			// not found.
			return;
		}

		var pattern = new RegExp('}}|'
		// 不用 TEMPLATE_NAME_PATTERN，預防把模板結尾一起吃掉了。
		+ TEMPLATE_START_PATTERN.source, 'g'), count = 1;
		// lastIndex - 1 : the last char is [|}]
		template_name.lastIndex = pattern.lastIndex = matched.lastIndex - 1;

		while (count > 0 && (matched = pattern.exec(wikitext))) {
			// 遇到模板結尾 '}}' 則減1，否則增1。
			if (matched[0] === '}}')
				count--;
			else
				count++;
		}

		wikitext = pattern.lastIndex > 0 ? wikitext.slice(template_name.index,
				pattern.lastIndex) : wikitext.slice(template_name.index);
		var result = [
		// [0]: {String}完整的模板token
		wikitext,
		// [1]: {String}模板名
		template_name[1].trim(),
		// [2] {String}parameters
		// 接下來要作用在已經裁切擷取過的 wikitext 上，需要設定好 index。
		// assert: 其他餘下 parameters 的部分以 [|}] 起始。
		// -2: 模板結尾 '}}'.length
		wikitext.slice(template_name.lastIndex - template_name.index, -2) ];
		Object.assign(result, {
			count : count,
			index : template_name.index,
			lastIndex : pattern.lastIndex
		});

		if (!parse_type || parse_type === 1) {
			// {{t|p=p|1|q=q|2}} → [ , 1, 2; p:'p', q:'q' ]
			var index = 1,
			/** {Array}parameters */
			parameters = [];
			// 警告: 這邊只是單純的以 '|' 分割，但照理來說應該再 call parser 來處理。
			// 最起碼應該除掉所有可能包含 '|' 的語法，例如內部連結 [[~|~]], 模板 {{~|~}}。
			result[2].split(/[\s\n]*\|[\s\n]*/)
			// 不處理 template name。
			.slice(1)
			//
			.forEach(function(token) {
				var matched = token.match(/^([^=]+)=(.*)$/);
				if (matched) {
					var key = matched[1].trim(),
					//
					value = matched[2].trim();
					if (false) {
						if (key in parameters) {
							// 參數名重複: @see [[Category:調用重複模板參數的頁面]]
							// 如果一個模板中的一個參數使用了多於一個值，則只有最後一個值會在顯示對應模板時顯示。
							// parser 調用超過一個Template中參數的值，只有最後提供的值會被使用。
							if (Array.isArray(parameters[key]))
								parameters[key].push(value);
							else
								parameters[key] = [ parameters[key], value ];
						} else {
							parameters[key] = value;
						}
					}
					parameters[key] = value;
				} else {
					parameters[index++] = token;
				}
			});

			if (parse_type === 1) {
				parameters[0] = result[1];
				result = parameters;
				// result[0] is template name.
				// result[p] is {{{p}}}
				// result[1] is {{{1}}}
				// result[2] is {{{2}}}
			} else {
				// .shift(): parameters 以 '|' 起始，因此需去掉最前面一個。
				// 2016/5/14 18:1:51 採用 [index] 的方法加入，因此無須此動作。
				// parameters.shift();
				result[2] = parameters;
			}
		}

		return result;
	}

	// ----------------------------------------------------

	// 因應不同的 mediawiki projects 來處理日期。
	// date_parser_config[language]
	// = [ {RegExp}PATTERN, {Function}parser({Array}matched) : return {String},
	// {Function}to_String({Date}date) : return {String} ]
	//
	// 可使用parse API來做測試。
	// https://www.mediawiki.org/w/api.php?action=help&modules=parse
	//
	// to_String: 日期的模式, should match "~~~~~".
	var date_parser_config = {
		en : [
				// e.g., "01:20, 9 September 2017 (UTC)"
				// [, time(hh:mm), d, m, Y, timezone ]
				/([0-2]?\d:[0-6]?\d)[, ]+([0-3]?\d) ([a-z]{3,9}) ([12]\d{3})(?: \(([A-Z]{3})\))?/ig,
				function(matched) {
					return matched[2] + ' ' + matched[3] + ' ' + +matched[4]
							+ ' ' + matched[1] + ' ' + (matched[6] || 'UTC');
				}, {
					format : '%2H:%2M, %d %m %Y (UTC)',
					// use UTC
					zone : 0,
					locale : 'en-US'
				} ],
		ja : [
				// e.g., "2017年9月5日 (火) 09:29 (UTC)"
				// [, Y, m, d, week, time(hh:mm), timezone ]
				/([12]\d{3})年([[01]?\d)月([0-3]?\d)日 \(([日月火水木金土])\)( [0-2]?\d:[0-6]?\d)(?: \(([A-Z]{3})\))?/g,
				function(matched) {
					return matched[1] + '/' + matched[2] + '/' + matched[3]
							+ matched[5] + ' ' + (matched[6] || 'UTC+9');
				}, {
					format : '%Y年%m月%d日 (%a) %2H:%2M (UTC)',
					// use UTC
					zone : 0,
					locale : 'ja-JP'
				} ],
		'zh-classical' : [
				// Warning: need CeL.data.numeral
				/([一二][〇一二三四五六七八九]{3})年([[〇一]?[〇一二三四五六七八九])月([〇一二三]?[〇一二三四五六七八九])日 （([日一二三四五六])）( [〇一二三四五六七八九]{1,2}時[〇一二三四五六七八九]{1,2})分(?: \(([A-Z]{3})\))?/g,
				function(matched) {
					return library_namespace
							.from_positional_Chinese_numeral(matched[1] + '/'
									+ matched[2] + '/' + matched[3]
									+ matched[5].replace('時', ':'))
							+ ' ' + (matched[6] || 'UTC+8');
				},
				function(date) {
					return library_namespace.to_positional_Chinese_numeral(date
							.format({
								format : '%Y年%m月%d日 （%a） %2H時%2M分 (UTC)',
								// use UTC
								zone : 0,
								locale : 'cmn-Hant-TW'
							}));
				} ],
		zh : [
				// $dateFormats, 'Y年n月j日 (D) H:i'
				// https://github.com/wikimedia/mediawiki/blob/master/languages/messages/MessagesZh_hans.php
				// e.g., "2016年8月1日 (一) 00:00 (UTC)",
				// "2016年8月1日 (一) 00:00 (CST)"
				// [, Y, m, d, week, time(hh:mm), timezone ]
				/([12]\d{3})年([[01]?\d)月([0-3]?\d)日 \(([日一二三四五六])\)( [0-2]?\d:[0-6]?\d)(?: \(([A-Z]{3})\))?/g,
				function(matched) {
					return matched[1] + '/' + matched[2] + '/' + matched[3]
					//
					+ matched[5] + ' '
					// new Date('2017/12/1 0:0 CST') !==
					// new Date('2017/12/1 0:0 UTC+8')
					+ (!matched[6] || matched[6] === 'CST' ? 'UTC+8'
					//
					: matched[6]);
				}, {
					format : '%Y年%m月%d日 (%a) %2H:%2M (UTC)',
					// use UTC
					zone : 0,
					locale : 'cmn-Hant-TW'
				} ]
	};

	/**
	 * parse date string / 時間戳記 to {Date}
	 * 
	 * @example <code>
	date_list = CeL.wiki.parse.date(CeL.wiki.content_of(page_data), {
		get_timevalue : true,
		get_all_list : true
	});
	 * </code>
	 * 
	 * @param {String}wikitext
	 *            date text to parse.
	 * @param {Object}options
	 *            附加參數/設定選擇性/特殊功能與選項
	 * 
	 * @returns {Date}date of the date string
	 * 
	 * @see [[en:Wikipedia:Signatures]], "~~~~~",
	 *      [[en:Help:Sorting#Specifying_a_sort_key_for_a_cell]]
	 */
	function parse_date(wikitext, options) {
		if (options === true) {
			options = {
				get_timevalue : true
			};
		} else if (typeof options === 'string'
				&& (options in date_parser_config)) {
			options = {
				language : options
			};
		} else {
			options = library_namespace.setup_options(options);
			if (!options.language && options[KEY_SESSION]) {
				options.language = options[KEY_SESSION].language;
			}
		}

		var date_list;
		if (options.get_all_list) {
			// 若設定 options.get_all_list，須保證回傳 {Array}。
			date_list = [];
		}
		if (!wikitext) {
			return date_list;
		}

		// <s>去掉</s>skip年分前之雜項。
		// <s>去掉</s>skip星期與其後之雜項。
		var matched, date_parser = date_parser_config[options.language
				|| default_language], PATTERN_date = date_parser[0];
		date_parser = date_parser[1];

		// reset PATTERN index
		PATTERN_date.lastIndex = 0;
		while (matched = PATTERN_date.exec(wikitext)) {
			// Warning:
			// String_to_Date()只在有載入CeL.data.date時才能用。但String_to_Date()比parse_date()功能大多了。
			var date = date_parser(matched);
			// console.log(date);
			date = Date.parse(date);
			if (isNaN(date)) {
				continue;
			}
			if (!options.get_timevalue) {
				date = new Date(date);
			}
			if (!options.get_all_list) {
				return date;
			}
			date_list.push(date);
		}

		return date_list;
	}

	/**
	 * 日期的格式。時間戳跟標準簽名日期格式一樣，讓時間轉換的小工具起效用。
	 * 
	 * assert: the same as "~~~~~".
	 * 
	 * @example <code>
	CeL.wiki.parse.date.to_String(new Date);
	 * </code>
	 */
	function to_wiki_date(date, language) {
		if (is_wiki_API(language)) {
			language = language.language;
		}
		// console.log(language || default_language);
		var to_String = date_parser_config[language || default_language][2];
		return library_namespace.is_Object(to_String)
		// treat to_String as date format
		? date.format(to_String) : to_String(date);
	}

	parse_date.to_String = to_wiki_date;

	// ------------------------------------------

	/**
	 * 使用者/用戶對話頁面所符合的匹配模式。
	 * 
	 * matched: [ all, " user name " ]
	 * 
	 * user_name = matched[1].trim()
	 * 
	 * match: [[:language_code:user_talk:user_name]]
	 * 
	 * @type {RegExp}
	 * 
	 * @see https://zh.wikipedia.org/w/api.php?action=query&meta=siteinfo&siprop=general|namespaces|namespacealiases|statistics&utf8
	 *      https://github.com/wikimedia/mediawiki/blob/master/languages/messages/MessagesZh_hant.php
	 */
	var PATTERN_user_link =
	// "\/": e.g., [[user talk:user_name/Flow]]
	// 大小寫無差，但NG: "\n\t"
	//
	// https://zh.wikipedia.org/wiki/Wikipedia:互助客栈/其他#增设空间“U：”、“UT：”作为“User：”、“User_talk：”的Alias
	// https://phabricator.wikimedia.org/T183711
	// Doesn't conflict with any language code or other interwiki link.
	// https://gerrit.wikimedia.org/r/#/c/400267/4/wmf-config/InitialiseSettings.php
	/\[\[ *:?(?:[a-z\d\-]{1,14}:?)?(?:user(?:[ _]talk)?|使用者(?:討論)?|用戶(?:討論|對話)?|用户(?:讨论|对话)?|利用者(?:‐会話)?|사용자(?:토론)?|UT?) *: *([^\[\]\|{}\n#\/�]+)/i,
	// [[特殊:功績]]: zh-classical, [[特別:投稿記録]]: ja
	// matched: [ all, " user name " ]
	PATTERN_user_contributions_link = /\[\[(?:Special|特別|特殊|特別) *: *(?:Contributions|Contribs|使用者貢獻|用戶貢獻|用户贡献|投稿記録|功績)\/([^\[\]\|{}\n#\/�]+)/i,
	//
	PATTERN_user_link_all = new RegExp(PATTERN_user_link.source, 'ig'), PATTERN_user_contributions_link_all = new RegExp(
			PATTERN_user_contributions_link.source, 'ig');

	/**
	 * parse user name. 解析使用者/用戶對話頁面資訊。找出用戶頁、用戶討論頁、用戶貢獻頁的連結。
	 * 
	 * @example <code>
	if (CeL.wiki.parse.user(CeL.wiki.title_link_of(title), user)) {}
	 * </code>
	 * 
	 * TODO: 應該按照不同的維基項目來做篩選。
	 * 
	 * @param {String}wikitext
	 *            wikitext to parse
	 * @param {String}[user_name]
	 *            測試是否為此 user name。 注意:這只會檢查第一個符合的連結。若一行中有多個連結，應該採用
	 *            CeL.wiki.parse.user.all() !
	 * @param {Boolean}[to_full_link]
	 *            get a full link
	 * 
	 * @returns {String}user name / full link
	 * @returns {Boolean}has the user name
	 * @returns {Undefined}Not a user link.
	 */
	function parse_user(wikitext, user_name, to_full_link) {
		if (!wikitext) {
			return;
		}

		var matched = wikitext.match(PATTERN_user_link), via_contributions;
		if (!matched) {
			matched = wikitext.match(PATTERN_user_contributions_link);
			if (!matched) {
				return;
			}
			via_contributions = true;
		}

		if (typeof user_name === 'boolean') {
			to_full_link = user_name;
			user_name = undefined;
		}
		// 正規化連結中的使用者名稱。
		var name_from_link = normalize_page_name(matched[1]);
		if (user_name) {
			// 用戶名正規化。
			user_name = normalize_page_name(user_name);
			if (user_name !== name_from_link) {
				return false;
			}
			if (!to_full_link) {
				return true;
			}
		}

		// may use get_page_title_link()
		return to_full_link ? via_contributions ? '[[User:' + name_from_link
				+ ']]' : matched[0].trimEnd() + ']]' : name_from_link;
	}

	/**
	 * parse all user name. 解析所有使用者/用戶對話頁面資訊。 CeL.wiki.parse.user.all()
	 * 
	 * @example <code>
	// 取得各使用者的簽名數量hash。
	var user_hash = CeL.wiki.parse.user.all(wikitext), user_list = Object.keys(user_hash);
	// 取得依照第一次出現處排序、不重複的使用者序列。
	var user_list = Object.keys(CeL.wiki.parse.user.all(wikitext));
	// 取得依照順序出現的使用者序列。
	var user_serial_list = CeL.wiki.parse.user.all(wikitext, true);
	 * </code>
	 * 
	 * @param {String}wikitext
	 *            wikitext to parse/check
	 * @param {String}[user_name]
	 *            測試是否有此 user name，return {Integer}此 user name 之連結數量。
	 *            若輸入true表示取得依照順序出現的使用者序列。
	 * 
	 * @returns {Integer}link count of the user name
	 * @returns {Object}normalized user name hash: hash[name] = {Integer}count
	 */
	function parse_all_user_links(wikitext, user_name) {
		function check_pattern(PATTERN_all) {
			// reset PATTERN index
			PATTERN_all.lastIndex = 0;
			var matched;
			library_namespace.debug(PATTERN_all, 3, 'parse_all_user_links');
			while (matched = PATTERN_all.exec(wikitext)) {
				// 用戶名正規化。
				var name = normalize_page_name(matched[1]);
				if (!user_name || user_name === name) {
					// console.log(name);
					if (user_list) {
						user_list.push(name);
					} else if (name in user_hash) {
						user_hash[name]++;
					} else {
						user_hash[name] = 1;
					}
				}
			}
		}

		var user_hash, user_list;
		if (user_name === true) {
			user_list = [];
			user_name = null;
		} else if (user_name) {
			// user_name should be {String}user name
			user_name = normalize_page_name(user_name);
		} else {
			user_hash = Object.create(null);
		}

		if (!wikitext) {
			return user_name ? 0 : user_list || user_hash;
		}

		library_namespace.debug(wikitext, 3, 'parse_all_user_links');
		library_namespace.debug('user name: ' + user_name, 3,
				'parse_all_user_links');

		check_pattern(PATTERN_user_link_all);
		check_pattern(PATTERN_user_contributions_link_all);

		if (user_list) {
			return user_list;
		}

		if (user_name) {
			return user_name in user_hash[user_name] ? user_hash[user_name] : 0;
		}

		return user_hash;
	}

	// CeL.wiki.parse.user.all()
	parse_user.all = parse_all_user_links;

	// 由使用者名稱來檢測匿名使用者/未註冊用戶 [[WP:IP]]
	function is_IP_user(user_name, IPv6) {
		// for IPv4
		return !IPv6 && /^[12]?\d{1,2}(?:\.[12]?\d{1,2}){3}$/.test(user_name)
		// for IPv6
		|| /^[\da-f]{1,4}(?::[\da-f]{1,4}){7}$/i.test(user_name);
	}

	// CeL.wiki.parse.user.is_IP()
	parse_user.is_IP = is_IP_user;

	//
	/**
	 * redirect/重定向頁所符合的匹配模式。 Note that the redirect link must be explicit – it
	 * cannot contain magic words, templates, etc.
	 * 
	 * matched: [ all, "title#section" ]
	 * 
	 * zh-classical: 重新導向
	 * 
	 * @type {RegExp}
	 * 
	 * @see https://en.wikipedia.org/wiki/Module:Redirect
	 *      https://zh.wikipedia.org/w/api.php?action=query&meta=siteinfo&siprop=general|namespaces|namespacealiases|statistics&utf8
	 *      https://github.com/wikimedia/mediawiki/blob/master/languages/messages/MessagesZh_hant.php
	 *      https://en.wikipedia.org/wiki/Help:Redirect
	 *      https://phabricator.wikimedia.org/T68974
	 */
	var PATTERN_redirect = /(?:^|[\s\n]*)#(?:REDIRECT|重定向|重新導向|転送|リダイレクト|넘겨주기)\s*(?::\s*)?\[\[([^\[\]\|{}\n�]+)(?:\|[^\[\]{}]+?)?\]\]/i;

	/**
	 * parse redirect page. 解析重定向資訊。 若 wikitext 重定向到其他頁面，則回傳其{String}頁面名:
	 * "title#section"。
	 * 
	 * @param {String}wikitext
	 *            wikitext to parse
	 * 
	 * @returns {String}title#section
	 * @returns {Undefined}Not a redirect page.
	 */
	function parse_redirect(wikitext) {
		if (false) {
			if (Array.isArray(wikitext)) {
				throw '您可能取得了多個版本';
				// 應該用:
				// content = CeL.wiki.content_of(page_data, 0);
				// 但是卻用成了:
				// content = CeL.wiki.content_of(page_data);
			}
			if (!wikitext || typeof wikitext !== 'string') {
				throw typeof wikitext
				return;
			}
		}

		var matched = wikitext && wikitext.match(PATTERN_redirect);
		if (matched) {
			return matched[1].trim();
		}

		if (false && wikitext.includes('__STATICREDIRECT__')) {
			library_namespace.debug('雖然特別指定了重定向頁面的 Magic word，但是並沒有發現重定向資訊。',
					3, 'parse_redirect');
		}
	}

	// ----------------------------------------------------

	/**
	 * 解析設定參數 wikitext configuration → JSON
	 * 
	 * 當解析發生錯誤的時候，應該要在設定頁面的討論頁顯示錯誤訊息。
	 * 
	 * @example <code>

	var configuration = CeL.wiki.parse_configuration(page_data);

	value = configuration[variable_name];

	</code>
	 * 
	 * 允許使用的設定格式: <code>

	(頁面開頭)
	註解說明(可省略)
	本頁面為 [[User:bot|]] ~~~作業的設定。每次執行作業前，機器人都會從本頁面讀入設定。您可以更改特定數值，但請盡量不要改變本頁的格式。自動生成的報表請參見：[[報告]]
	 * 請注意：變更本頁面後，必須重新執行機器人程式才有效果。

	; 單一值變數名1: 變數值
	; 單一值變數名2: 變數值

	; 列表變數名1
	: 變數值1
	: 變數值2

	 == 列表變數名2 ==
	 註解說明(可省略)
	 * 變數值1
	 * <nowiki>變數值2</nowiki>

	== 列表變數名3 ==
	註解說明(可省略)
	# 變數值1
	# <nowiki>變數值2</nowiki>

	</code>
	 * 
	 * @see [[w:zh:User:Cewbot/規範多個問題模板設定]], [[w:zh:User:Cewbot/討論頁面主題列表設定]]
	 * @see 存檔 舊議 [[w:zh:Template:Easy_Archive]],
	 *      [[w:en:Template:Auto_archiving_notice]],
	 *      [[w:en:Template:Setup_auto_archiving]]
	 */
	function parse_configuration(wikitext) {
		// 忽略 <span> 之類。
		function filter_tags(token) {
			// console.log(token);
			if (token.type === 'tag') {
				return filter_tags(token[1]);
			}
			if (Array.isArray(token)) {
				return token.toString.call(token.map(filter_tags));
			}
			return token;
		}

		function normalize_value(value) {
			return filter_tags(value).toString().trim()
			// TODO: <syntaxhighlight lang="JavaScript" line start="55">
			// https://www.mediawiki.org/wiki/Extension:SyntaxHighlight
			// <source lang="cpp">
			.replace(/<\/?(?:nowiki|code)>/g, '')
			// link → page title
			.replace(/^\[\[([^\[\]\|{}\n�]+)(?:\|[^\[\]{}]+?)?\]\]$/, '$1');
		}

		/** {Object}設定頁面/文字所獲得之個人化設定/手動設定 manual settings。 */
		var configuration = Object.create(null),
		/** {String}當前使用之變數名稱 */
		variable_name,
		// using parser
		parsed, configuration_page_title;

		if (get_page_content.is_page_data(wikitext)) {
			variable_name = wikitext.title;
			configuration_page_title = variable_name;
			parsed = page_parser(wikitext).parse();
			// wikitext = get_page_content(wikitext);
		} else {
			// assert: typeof wikitext === 'string'
			parsed = parse_wikitext(wikitext);
		}

		if (!Array.isArray(parsed)) {
			return configuration;

			return;
			throw 'Invalid configuration wikitext';
		}

		// 僅處理第一階層。
		parsed.forEach(function(token) {
			if (token.type === 'section_title') {
				variable_name = normalize_value(token.title);
				return;
			}

			// parse table
			// @see wiki_API.table_to_array
			if (token.type === 'table' && (token.caption || variable_name)) {
				var value = [];
				token.forEach(function(line) {
					if (line.type !== 'table_row'
					// 注意: caption 也被當作 table_row 看待。
					|| line.caption) {
						return;
					}
					if (line.is_head) {
						// TODO: using the data
						return;
					}
					var row = [];
					line.forEach(function(cell) {
						if (cell.type !== 'table_cell') {
							return;
						}

						// TODO: data-sort-type in table head

						var data_type;
						cell = normalize_value(cell.filter(function(token) {
							if (token.type !== 'table_style')
								return true;
							data_type = token.toString()
							// @see
							// [[w:en:Help:Sorting#Configuring the sorting]]
							// [[w:en:Help:Sorting#Specifying_a_sort_key_for_a_cell]]
							.match(/data-sort-type=(["']([^"']+)["']|[^\s]+)/);
							if (data_type) {
								data_type = data_type[1] || data_type[2];
							}
						}).map(filter_tags).join(''));

						if (typeof data_type === 'number') {
							if (!isNaN(data_type = +cell))
								cell = data_type;
						} else if (typeof data_type === 'isoDate') {
							data_type = Date.parse(cell
									.replace(/<[^<>]+>/g, ''));
							if (!isNaN(data_type))
								cell = new Date(data_type);
						}

						row.push(cell);
					});
					// console.log(line);
					value.push(row);
				});
				configuration[token.caption || variable_name] = value;
				// 僅採用第一個列表。
				if (!token.caption)
					variable_name = null;
			}

			if (token.type !== 'list')
				return;

			if (token.list_type !== DEFINITION_LIST) {
				if (variable_name) {
					configuration[variable_name] = token.map(normalize_value);
					// 僅採用一個列表。
					variable_name = null;
				}
				return;
			}

			token.dt_index.forEach(function(dt_index, index) {
				variable_name = normalize_value(token[dt_index]);
				if (!variable_name)
					return;
				var next_dt_index = token.dt_index[index + 1] || token.length;
				configuration[variable_name]
				// 變數的值
				= dt_index + 2 === next_dt_index
				// 僅僅提供單一數值。
				? normalize_value(token[dt_index + 1])
				// 提供了一個列表。
				: token.slice(dt_index + 1, next_dt_index)
				//
				.map(normalize_value);
			});
			variable_name = null;
		});

		// 避免被覆蓋。保證用 configuration.configuration_page_title 可以檢查是否由頁面取得了設定。
		// 注意: 當設定頁面為空的時候，無法獲得這個值。
		if (configuration_page_title) {
			configuration.configuration_page_title = configuration_page_title;
		} else {
			delete configuration.configuration_page_title;
		}

		return configuration;
	}

	wiki_API.parse_configuration = parse_configuration;

	// ----------------------------------------------------

	// https://zh.wikipedia.org/wiki/條目#hash 說明
	// https://zh.wikipedia.org/zh-tw/條目#hash 說明
	// https://zh.wikipedia.org/zh-hans/條目#hash 說明
	// https://zh.wikipedia.org/w/index.php?title=條目
	// https://zh.wikipedia.org/w/index.php?uselang=zh-tw&title=條目
	// https://zh.m.wikipedia.org/wiki/條目#hash
	/**
	 * Wikipedia:Wikimedia sister projects 之 URL 匹配模式。
	 * 
	 * matched: [ all, 第一 domain name (e.g., language code / family / project),
	 * title 條目名稱, section 章節, link說明 ]
	 * 
	 * TODO: /wiki/條目#hash 說明
	 * 
	 * TODO: https://zh.wikipedia.org/zh-tw/標題 →
	 * https://zh.wikipedia.org/w/index.php?title=標題&variant=zh-tw
	 * 
	 * @type {RegExp}
	 * 
	 * @see PATTERN_PROJECT_CODE
	 * @see PATTERN_URL_GLOBAL, PATTERN_URL_WITH_PROTOCOL_GLOBAL,
	 *      PATTERN_URL_prefix, PATTERN_WIKI_URL, PATTERN_wiki_project_URL,
	 *      PATTERN_external_link_global
	 * @see https://en.wikipedia.org/wiki/Wikipedia:Wikimedia_sister_projects
	 */
	var PATTERN_WIKI_URL = /^(?:https?:)?\/\/([a-z][a-z\d\-]{0,14})\.(?:m\.)?wikipedia\.org\/(?:(?:wiki|zh-[a-z]{2,4})\/|w\/index\.php\?(?:uselang=zh-[a-z]{2}&)?title=)([^ #]+)(#[^ ]*)?( .+)?$/i;

	/**
	 * Convert URL to wiki link.
	 * 
	 * TODO: 在 default_language 非 zh 使用 uselang, /zh-tw/條目 會有問題。 TODO: [[en
	 * link]] → [[:en:en link]] TODO: use {{tsl}} or {{link-en}},
	 * {{en:Template:Interlanguage link multi}}.
	 * 
	 * TODO: 與 get_page_title_link() 整合。
	 * 
	 * @param {String}URL
	 *            URL text
	 * @param {Boolean}[add_quote]
	 *            是否添加 [[]] 或 []。
	 * @param {Function}[callback]
	 *            回調函數。 callback({String}wiki link)
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * 
	 * @returns {String}wiki link
	 * 
	 * @see [[WP:LINK#跨语言链接]]
	 */
	function URL_to_wiki_link(URL, add_quote, callback, options) {
		URL = URL.trim();
		// URL = URL.replace(/[\s\n]+/g, ' ');

		var matched = URL.match(PATTERN_WIKI_URL);
		if (!matched) {
			library_namespace.debug('Can not parse URL: [' + URL
					+ ']. Not a wikipedia link?', 3, 'URL_to_wiki_link');
			if (add_quote) {
				if (PATTERN_URL_prefix.test(URL)) {
					// 當作正常外部連結 external link。
					// e.g., 'http://a.b.c ABC'

					// TODO: parse.
					// @see function fix_86() @ 20151002.WPCHECK.js
					// matched = URL.match(/^([^\|]+)\|(.*)$/);

					URL = '[' + URL + ']';
				} else {
					// 當作正常內部連結 wikilink / internal link。
					// e.g., 'ABC (disambiguation)|ABC'
					URL = get_page_title_link(URL);
				}
			}
			if (callback) {
				callback(URL);
			}
			return URL;
		}

		/** {String}章節 = URL hash */
		var section = matched[3] || '';
		// for [[:mw:Multimedia/Media Viewer]],
		// [[:mw:Extension:MultimediaViewer|媒體檢視器]]
		if (section) {
			if (section.startsWith('#/media/File:')) {
				// 8 === '#/media/'.length
				return section.slice(8);
			}

			// 須注意: 對某些 section 可能 throw！
			try {
				section = decodeURIComponent(section.replace(/\./g, '%'));
			} catch (e) {
				// TODO: handle exception
			}
		}

		/** {String}URL之語言 */
		var language = matched[1].toLowerCase(),
		/** {String}條目名稱 */
		title = decodeURIComponent(matched[2]);

		function compose_link() {
			var link = (language === default_language ? ''
			//
			: ':' + language + ':') + title + section
			// link 說明
			+ (matched[4] && (matched[4] = matched[4].trim())
			//
			!== title ? '|' + matched[4]
			// [[Help:編輯頁面#链接]]
			// 若"|"後直接以"]]"結束，則儲存時會自動添加連結頁面名。
			: !section && /\([^()]+\)$/.test(title)
			// e.g., [[title (type)]] → [[title (type)|title]]
			// 在 <gallery> 中，"[[title (type)|]]" 無效，因此需要明確指定。
			? '|' + title.replace(/\s*\([^()]+\)$/, '') : '');

			if (add_quote) {
				link = get_page_title_link(link);
			}

			return link;
		}

		// 無 callback，直接回傳 link。
		if (!callback) {
			return compose_link();
		}

		// 若非外 project 或不同 language，則直接 callback(link)。
		if (section || language === default_language) {
			callback(compose_link());
			return;
		}

		// 嘗試取得本 project 之對應連結。
		wiki_API.langlinks([ language, title ], function(to_title) {
			if (to_title) {
				language = default_language;
				title = to_title;
				// assert: section === ''
			}
			callback(compose_link());
		}, default_language, options);
	}

	// ----------------------------------------------------

	// 簡易快速但很有可能出錯的 parser。
	// e.g.,
	// CeL.wiki.parse.every('{{lang}}','~~{{lang|en|ers}}ff{{ee|vf}}__{{lang|fr|fff}}@@{{lang}}',function(token){console.log(token);})
	// CeL.wiki.parse.every('{{lang|ee}}','~~{{lang|en|ers}}ff{{ee|vf}}__{{lang|fr|fff}}@@{{lang}}',function(token){console.log(token);})
	// CeL.wiki.parse.every(['template','lang'],'~~{{lang|en|ers}}ff{{ee|vf}}__{{lang|fr|fff}}@@{{lang}}',function(token){console.log(token);})
	// CeL.wiki.parse.every(/{{[Ll]ang\b[^{}]*}}/g,'~~{{lang|en|ers}}ff{{ee|vf}}__{{lang|fr|fff}}@@{{lang}}',function(token){console.log(token);},CeL.wiki.parse.template)
	function parse_every(pattern, wikitext, callback, parser) {
		// assert: pattern.global === true
		var matched, count = 0;

		if (!parser) {
			if (typeof pattern === 'string'
					&& (matched = pattern.match(/{{([^{}]+)}}/)))
				pattern = [ 'template', matched[1] ];

			if (Array.isArray(pattern)) {
				parser = parse_wikitext[matched = pattern[0]];
				pattern = pattern[1];
				if (typeof pattern === 'string') {
					if (matched === 'template')
						pattern = new RegExp('{{ *(?:' + pattern
								+ ')(?:}}|[^a-z].*?}})', 'ig');
				}
			}
		}

		while (matched = pattern.exec(wikitext)) {
			if (parser) {
				var data = matched;
				matched = parser(matched[0]);
				if (!matched)
					// nothing got.
					continue;

				// 回復 recover index
				matched.index = data.index;
			}

			matched.lastIndex = pattern.lastIndex;
			matched.count = count++;
			callback(matched);
		}
	}

	function parse_timestamp(timestamp) {
		// return Date.parse(timestamp);
		return new Date(timestamp);
	}

	// CeL.wiki.parser(wikitext) 傳回 parser，可作 parser.parse()。
	// CeL.wiki.parse.*(wikitext) 僅處理單一 token，傳回 parse 過的 data。
	// TODO: 統合於 CeL.wiki.parser 之中。
	Object.assign(parse_wikitext, {
		template : parse_template,
		date : parse_date,
		// timestamp : parse_timestamp,
		user : parse_user,
		redirect : parse_redirect,

		wiki_URL : URL_to_wiki_link,

		every : parse_every
	});

	// ------------------------------------------------------------------------

	// CeL.wiki.HTML_to_wikitext(HTML)
	// TODO: 應該 parse HTML。
	function HTML_to_wikitext(HTML, options) {
		return HTML
		//
		.replace(/<\/i><i>/g, '').replace(/<\/b><b>/g, '').replace(
				/<\/strong><strong>/g, '')
		//
		.replace(/<i>([\s\S]+?)<\/i>/g, "''$1''").replace(
				/<b>([\s\S]+?)<\/b>/g, "'''$1'''").replace(
				/<strong>([\s\S]+?)<\/strong>/g, "'''$1'''")
		//
		.replace_till_stable(/<span(?: [^<>]*)?>([^<>]*?)<\/span>/g, "$1")
		//
		.replace(/<a ([^<>]+)>([\s\S]+?)<\/a>/g,
		//
		function(all, attributes, innerHTML) {
			var href = attributes.match(/href="([^"]+)"/);
			return '[' + (href ? href[1] : '#') + ' ' + innerHTML + ']';
		})
		//
		.replace(/<br(?: [^<>]*)?>\n*/ig, '\n').replace(/<p ?\/>\n*/ig, '\n\n')
		// ignore style, remove <p style="...">...</p>
		// .replace(/<p[^<>]*>([^<>]*)<\/p>[\s\n]*/g, '$1\n\n')
		.replace(/<p>([\s\S]+?)<\/p>\n*/g, '$1\n\n')
		//
		.replace(/\r?\n/g, '\n').replace(/\n{3,}/g, '\n\n');
	}

	// ------------------------------------------------------------------------

	/**
	 * 把表格型列表頁面轉為原生陣列。 wikitext table to array table, to table
	 * 
	 * TODO: 按標題統合內容。
	 * 
	 * @param {Object}page_data
	 *            page data got from wiki API.
	 * @param {Object}options
	 *            附加參數/設定選擇性/特殊功能與選項
	 * 
	 * @returns {Array}陣列資料。
	 * 
	 * @example<code>

	CeL.run(['application.platform.nodejs', 'data.CSV']);
	wiki.page('List of monarchs of Thailand', function(page_data) {
		CeL.wiki.table_to_array(page_data, 'monarchs of Thailand.txt');
	});

	</code>
	 */
	wiki_API.table_to_array = function(page_data, options) {
		if (!get_page_content.is_page_data(page_data)) {
			library_namespace.error('Invalid page data!');
			return;
		}
		if (typeof options === 'string') {
			options = {
				file : options
			};
		}

		var heads = [], array = [],
		// handler
		processor = options && options.row_processor;

		page_parser(page_data).parse()
		// 僅處理第一階層。
		.forEach(function(node) {
			if (node.type === 'section_title') {
				if (false) {
					library_namespace.debug(node.length + ','
					//
					+ node.index + ',' + node.level, 3);
					return;
				}
				// 從 section title 紀錄標題。
				var title = node[0];
				if (title.type === 'link') {
					title = title[0][0];
				}
				// console.log(title.toString());
				heads.truncate(node.level);
				heads[node.level] = title.toString().trim();

			} else if (node.type === 'table') {
				library_namespace.debug(node.length + ','
				//
				+ node.index + ',' + node.type, 3);
				node.forEach(function(row) {
					var cells = [], is_head;
					row.forEach(function(cell) {
						if (cell.type === 'table_style') {
							// 不計入style
							return;
						}
						// return cell.toString().replace(/^[\n\|]+/, '');

						if (cell.is_head) {
							// 將以本列最後一個 cell 之 type 判定本列是否算作標題列。
							// 亦可用 row.is_head
							is_head = cell.is_head;
						}

						var append_cells;
						if (cell[0].type === 'table_style') {
							append_cells = cell[0].toString()
							// 檢測要增加的null cells
							.match(/[^a-z\d_]colspan=(?:"\s*)?(\d{1,2})/i);
							if (append_cells) {
								// -1: 不算入自身。
								append_cells = append_cells[1] - 1;
							}

							var matched = cell[0].toString()
							//
							.match(/[^a-z\d_]rowspan=(?:"\s*)?(\d{1,2})/i);

							if (matched && matched[1] > 1) {
								library_namespace.error(
								// TODO
								'We can not deal with rowspan yet.');
							}

							// 去掉style
							// 注意: 本函式操作時不可更動到原資料。
							var toString = cell.toString;
							cell = cell.clone();
							cell.shift();
							cell.toString = toString;
						}
						cells.push(cell && cell.toString()
						//
						.replace(/^[\|\s]+/, '').trim() || '');
						if (append_cells > 0) {
							cells.append(new Array(append_cells).fill(''));
						}
					});
					if (cells.length > 0) {
						if (is_head) {
							// 對於 table head，不加入 section title 資訊。
							cells.unshift('', '');
						} else {
							cells.unshift(heads[2] || '', heads[3] || '');
						}
						if (processor) {
							cells = processor(cells);
						}
						array.push(cells);
					}
				});
			}
		});

		// output file. e.g., page_data.title + '.csv.txt'
		if (options && options.file) {
			if (library_namespace.write_file && library_namespace.to_CSV_String) {
				library_namespace.write_file(options.file,
				// 存成 .txt，並用 "\t" 分隔，可方便 Excel 匯入。
				library_namespace.to_CSV_String(array, {
					field_delimiter : '\t'
				}));
			} else {
				library_namespace.error("Must includes frrst: "
						+ library_namespace.Class
						+ ".run(['application.platform.nodejs', 'data.CSV']);");
			}
		}

		return array;
	};

	// ------------------------------------------------------------------------

	/**
	 * get title of page.
	 * 
	 * @example <code>
	   var title = CeL.wiki.title_of(page_data);
	 * </code>
	 * 
	 * @param {Object}page_data
	 *            page data got from wiki API.
	 * 
	 * @returns {String|Undefined}title of page, maybe undefined.
	 * 
	 * @see wiki_API.query.id_of_page
	 * @see wiki_API.query.title_param()
	 */
	function get_page_title(page_data) {
		// 處理 [ {String}API_URL, {String}title or {Object}page_data ]
		if (Array.isArray(page_data)) {
			if (get_page_content.is_page_data(page_data[0])) {
				// assert: page_data = [ page data, page data, ... ]
				return page_data.map(get_page_title);
			}
			if (is_api_and_title(page_data)) {
			}
			// assert: page_data =
			// [ {String}API_URL, {String}title || {Object}page_data ]
			return get_page_title(page_data[1]);
		}

		if (library_namespace.is_Object(page_data)) {
			var title = page_data.title;
			// 檢測一般頁面
			if (title) {
				// should use get_page_content.is_page_data(page_data)
				return title;
			}

			// for flow page
			// page_data.header: 在 Flow_page() 中設定。
			// page_data.revision: 由 Flow_page() 取得。
			title =
			// page_data.is_Flow &&
			(page_data.header || page_data).revision;
			if (title && (title = title.articleTitle)) {
				// e.g., "Wikipedia talk:Flow tests"
				return title;
			}

			return undefined;
		}

		if (typeof page_data === 'string') {
			// 例外處理: ':zh:title' → 'zh:title'
			page_data = page_data.replace(/^[\s:]+/, '')
		} else {
			// e.g., page_data === undefined
		}

		return page_data;
	}

	// get the wikilink of page_data.
	// CeL.wiki.title_link_of()
	// 'title'→'[[title]]'
	// 'zh:title'→'[[:zh:title]]'
	// 'n:title'→'[[:n:title]]'
	// 'Category:category'→'[[:Category:category]]'
	// TODO: [[link|<span style="color: #000;">title</span>]]
	// TODO: 與 URL_to_wiki_link() 整合。
	// TODO: #section name
	// TODO: 複製到非維基項目外的私人維基，例如moegirl時，可能需要用到[[zhwiki:]]這樣的prefix。
	function get_page_title_link(page_data, session, display_text) {
		var title,
		// e.g., is_category
		need_escape, project_prefixed;

		// is_api_and_title(page_data)
		if (get_page_content.is_page_data(page_data)) {
			need_escape = page_data.ns === get_namespace.hash.category;
			title = page_data.title;
		} else if ((title = get_page_title(page_data))
		// 通常應該:
		// is_api_and_title(page_data) || typeof page_data === 'string'
		&& typeof title === 'string') {
			// @see normalize_page_name()
			title = title.replace(/^[\s:]+/, '');

			// e.g., 'zh:title'
			// @see PATTERN_PROJECT_CODE_i
			project_prefixed = /^ *[a-z]{2}[a-z\d\-]{0,14} *:/i.test(title)
			// 排除 'Talk', 'User', 'Help', 'File', ...
			&& !get_namespace.pattern.test(title);
			// escape 具有特殊作用的 title。
			need_escape = PATTERN_category_prefix.test(title)
			// 應允許非規範過之 title，如採用 File: 與 Image:, 檔案:。
			|| PATTERN_file_prefix.test(title) || project_prefixed;
		}

		if (!title) {
			return '';
		}
		if (is_wiki_API(session)) {
			if (session.language && !project_prefixed) {
				// e.g., [[w:zh:title]]
				title = session.language + ':' + title;
				if (session.family
						&& (session.family in api_URL.shortcut_of_project)) {
					title = api_URL.shortcut_of_project[session.family] + ':'
							+ title;
				} else {
					need_escape = true;
				}
			}
		} else if (session) {
			// e.g., `CeL.wiki.title_link_of(page_data, display_text)`
			// shift arguments
			display_text = session;
			session = null;
		}

		// TODO: [[s:zh:title]] instead of [[:zh:title]]

		if (need_escape) {
			title = ':' + title;
		}
		// TODO: for template transclusion, use {{title}}
		return '[['
				+ title
				+ (display_text && display_text !== title ? '|' + display_text
						: '') + ']]';
	}

	/**
	 * get the contents of page data. 取得頁面內容。
	 * 
	 * @example <code>
	   var content = CeL.wiki.content_of(page_data);
	   // 當取得了多個版本:
	   var content = CeL.wiki.content_of(page_data, 0);
	 * </code>
	 * 
	 * @param {Object}page_data
	 *            page data got from wiki API.
	 * @param {String}flow_view
	 *            對 flow page，所欲取得之頁面內容項目。<br />
	 *            default: 'header'
	 * 
	 * @returns {String|Undefined}content of page, maybe undefined.
	 */
	function get_page_content(page_data, flow_view) {
		if (!page_data) {
			// e.g., page_data === undefined
			return page_data;
		}

		// for flow page: 因為 page_data 可能符合一般頁面標準，
		// 此時會先得到 {"flow-workflow":""} 之類的內容，
		// 因此必須在檢測一般頁面之前先檢測 flow page。
		// page_data.header: 在 Flow_page() 中設定。
		// page_data.revision: 由 Flow_page() 取得。
		var content =
		// page_data.is_Flow &&
		(page_data[flow_view] || page_data['header'] || page_data).revision;
		if (content && (content = content.content)) {
			// page_data.revision.content.content
			return content.content;
		}

		if (page_data.expandtemplates
		// 若有則用之否，則最起碼回傳一般的內容。
		&& ('wikitext' in page_data.expandtemplates)) {
			if (flow_view === 'expandtemplates')
				return String(page_data.expandtemplates.wikitext || '');

			library_namespace.debug(get_page_title_link(page_data)
			//
			+ ': The page has expandtemplates.wikitext but do not used.', 1,
					'get_page_content');
		}

		// 檢測一般頁面。
		if (get_page_content.is_page_data(page_data)) {
			// @see get_page_content.revision
			content = library_namespace.is_Object(page_data)
			//
			&& page_data.revisions;
			if (!Array.isArray(content) || !content[0]) {
				// invalid page data
				// 就算 content.length === 0，本來就不該回傳東西。
				// 警告：可能回傳 null or undefined，尚未規範。
				return '';
			}
			if (content.length > 1 && typeof flow_view !== 'number') {
				// 有多個版本的情況：因為此狀況極少，不統一處理。
				// 一般說來caller自己應該知道自己設定了rvlimit>1，因此此處不警告。
				// 警告：但多版本的情況需要自行偵測是否回傳{Array}！
				return content.map(function(revision) {
					return revision['*'];
				});
			}
			if (flow_view < 0) {
				// e.g., -1: select the oldest revision.
				flow_view += content.length;
			}
			content = content[flow_view | 0];
			return content && content['*'] || '';
		}

		// 一般都會輸入 page_data: {"pageid":0,"ns":0,"title":""}
		// : typeof page_data === 'string' ? page_data

		// ('missing' in page_data): 此頁面不存在/已刪除。
		// e.g., { ns: 0, title: 'title', missing: '' }
		// TODO: 提供此頁面的刪除和移動日誌以便參考。
		return ('missing' in page_data) ? undefined : String(page_data || '');
	}

	/**
	 * check if page_data is page data.
	 * 
	 * @param {Object}page_data
	 *            page data got from wiki API.
	 * 
	 * @returns {String|Number} pageid
	 */
	get_page_content.is_page_data = function(page_data) {
		return library_namespace.is_Object(page_data)
		// 可能是 missing:""，此時仍算 page data。
		&& (page_data.title || ('pageid' in page_data));
	};

	/**
	 * get the id of page
	 * 
	 * @param {Object}page_data
	 *            page data got from wiki API.
	 * 
	 * @returns {String|Number} pageid
	 */
	get_page_content.pageid = function(page_data) {
		return get_page_content.is_page_data(page_data) && page_data.pageid;
	};

	// return {Object}main revision (.revisions[0])
	get_page_content.revision = function(page_data, NO) {
		return library_namespace.is_Object(page_data)
		// treat as page data. Try to get page contents: page.revisions[0]['*']
		// 一般說來應該是由新排到舊，[0] 為最新的版本 last revision。
		&& page_data.revisions && page_data.revisions[NO || 0];
	};

	// CeL.wiki.content_of.edit_time(page_data) -
	// new Date(page_data.revisions[0].timestamp) === 0
	// TODO: page_data.edit_time(revision_NO, return_value)
	// return {Date}最後編輯時間/最近的變更日期。
	// 更正確地說，revision[0]（通常是最後一個 revision）的 timestamp。
	get_page_content.edit_time = function(page_data, revision_NO, return_value) {
		var timestamp = library_namespace.is_Object(page_data)
				&& page_data.revisions;
		if (timestamp
				&& (timestamp = timestamp[revision_NO || 0] || timestamp[0])
				&& (timestamp = timestamp.timestamp)) {
			return return_value ? Date.parse(timestamp) : new Date(timestamp);
		}
	};

	/**
	 * check if the page_data has contents. 不回傳 {String}，減輕需要複製字串的負擔。
	 * 
	 * @param {Object}page_data
	 *            page data got from wiki API.
	 * 
	 * @returns {Boolean} the page_data has / do not has contents.
	 * @returns {Undefined} the page_data do not has contents.
	 */
	get_page_content.has_content = function(page_data) {
		var revision = get_page_content.revision(page_data);
		return revision && !!revision['*'];
	};

	// ------------------------------------------------------------------------

	// check if session.last_data is usable, 非過期資料。
	function last_data_is_usable(session) {
		if (session.last_data && !session.last_data.error
		// 若是session.last_data與session.last_page連動，必須先確認是否沒變更過session.last_page，才能當作cache、跳過重新擷取entity之作業。
		&& (!(KEY_CORRESPOND_PAGE in session.last_data)
		// assert:
		// get_page_content.is_page_data(session.last_data[KEY_CORRESPOND_PAGE])
		|| session.last_page === session.last_data[KEY_CORRESPOND_PAGE])) {
			library_namespace.debug('Use cached data: [['
			//
			+ (KEY_CORRESPOND_PAGE in session.last_data
			// may use get_page_title_link()
			? session.last_page.id : session.last_data.id) + ']]', 1,
					'last_data_is_usable');
			return true;
		}
	}

	// --------------------------------------------------------------------------------------------
	// instance 相關函數。

	wiki_API.prototype.configurations = default_site_configurations;

	wiki_API.prototype.toString = function(type) {
		return get_page_content(this.last_page) || '';
	};

	// @see function get_continue(), get_list()
	wiki_API.prototype.show_next = typeof JSON === 'object' && JSON.stringify
	//
	? function() {
		return this.next_mark && JSON.stringify(this.next_mark);
	} : function() {
		if (!this.next_mark)
			return;
		var line = [], value;
		for ( var name in this.next_mark) {
			value = this.next_mark[name];
			line.push(name + ':' + (typeof value === 'string'
			//
			? '"' + value.replace(/"/g, '\\"') + '"' : value));
		}
		if (line.length > 0)
			return '{' + line.join(',') + '}';
	};

	/**
	 * 設定工作/添加新的工作。
	 * 
	 * 注意: 每個 callback 皆應在最後執行 session.next()。
	 * 
	 * 警告: 若 callback throw，可能導致工作中斷，不會自動復原，得要以 wiki.next() 重起工作。
	 * 
	 * 工作原理: 每個實體會hold住一個queue ({Array}this.actions)。 當設定工作時，就把工作推入佇列中。
	 * 另外內部會有另一個行程負責依序執行每一個工作。
	 */
	wiki_API.prototype.next = function() {
		this.running = 0 < this.actions.length;
		if (!this.running) {
			library_namespace.debug('The queue is empty.', 2,
					'wiki_API.prototype.next');
			// console.warn(this);
			return;
		}

		library_namespace.debug('剩餘 ' + this.actions.length + ' action(s)', 2,
				'wiki_API.prototype.next');
		if (library_namespace.is_debug(3)
		// .show_value() @ interact.DOM, application.debug
		&& library_namespace.show_value)
			library_namespace.show_value(this.actions.slice(0, 10));
		var _this = this, next = this.actions.shift(),
		// 不改動 next。
		type = next[0], list_type;
		if (type in get_list.type) {
			list_type = type;
			type = 'list';
		}

		if (library_namespace.is_debug(2)) {
			library_namespace.debug(
			//
			'處理 ' + (this.token.lgname ? this.token.lgname + ' ' : '') + '['
			//
			+ next.map(function(arg) {
				// for function
				return String(arg).slice(0, 80);
			}) + ']', 1, 'wiki_API.prototype.next');
		}

		// 若需改變，需同步更改 wiki_API.prototype.next.methods
		switch (type) {

		// ------------------------------------------------
		// setup options

		case 'set_URL':
			// next[1] : callback
			setup_API_URL(this /* session */, next[1]);
			this.next();
			break;

		case 'set_language':
			// next[1] : callback
			setup_API_language(this /* session */, next[1]);
			this.next();
			break;

		case 'set_data':
			// 設定 this.data_session。
			// setup_data_session(session, callback, API_URL, password, force)
			setup_data_session(this /* session */,
			// 確保 data_session login 了才執行下一步。
			function() {
				// next[1] : callback of set_data
				if (typeof next[1] === 'function')
					next[1].call(_this);
				_this.next();
			}, next[2], next[3], next[4]);
			break;

		// ------------------------------------------------
		// account

		case 'login':
			library_namespace.debug(
					'正 log in 中，當 login 後，會自動執行 .next()，處理餘下的工作。', 2,
					'wiki_API.prototype.next');
			// rollback
			this.actions.unshift(next);
			break;

		case 'logout':
			// 結束
			// next[1] : callback
			wiki_API.logout(this /* session */, next[1]);
			break;

		// ------------------------------------------------
		// page access

		case 'query':
			console.trace('use query');
			throw 'Please use .query_API() instead of only .query()!';
			library_namespace
					.error('Please use .query_API() instead of only .query()!');
		case 'query_API':
			// wiki_API.query(action, callback, post_data, options)
			wiki_API.query(next[1], function query_API_callback(data, error) {
				if (typeof next[2] === 'function') {
					// next[2] : callback
					next[2].call(_this, data, error);
				}
				// 再設定一次，預防有執行期中間再執行的情況。
				// e.g., wiki.query_api(action,function(){wiki.page();})
				// 注意: 這動作應該放在callback()執行完後設定。
				_this.next();
			}, next[3],
			// next[4] : options
			Object.assign({
				// [KEY_SESSION]
				session : this
			}, next[4]));
			break;

		case 'siteinfo':
			// wiki.siteinfo(options, callback)
			// wiki.siteinfo(callback)
			if (typeof next[1] === 'function' && !next[2]) {
				// next[1] : callback
				next[2] = next[1];
				next[1] = null;
			}

			wiki_API.siteinfo(Object.assign({
				// [KEY_SESSION]
				session : this
			}, next[1]), function(data, error) {
				if (typeof next[2] === 'function') {
					// next[2] : callback
					next[2].call(_this, data, error);
				}
				// run next action
				_this.next();
			});
			break;

		case 'page':
			// this.page(page data, callback, options);
			if (library_namespace.is_Object(next[2]) && !next[3])
				// 直接輸入 options，未輸入 callback。
				next.splice(2, 0, null);

			// → 此法會採用所輸入之 page data 作為 this.last_page，不再重新擷取 page。
			if (get_page_content.is_page_data(next[1])
			// 必須有頁面內容，要不可能僅有資訊。有時可能已經擷取過卻發生錯誤而沒有頁面內容，此時依然會再擷取一次。
			&& (get_page_content.has_content(next[1])
			// 除非剛剛才取得，同一個執行緒中不需要再度取得內容。
			|| next[3] && next[3].allow_missing && ('missing' in next[1]))) {
				library_namespace.debug('採用所輸入之 '
						+ get_page_title_link(next[1]) + ' 作為 this.last_page。',
						2, 'wiki_API.prototype.next');
				this.last_page = next[1];
				if (typeof next[2] === 'function') {
					// next[2] : callback
					next[2].call(this, next[1]);
				}
				this.next();
			} else if (typeof next[1] === 'function') {
				// this.page(callback): callback(last_page)
				// next[1] : callback
				next[1].call(this, this.last_page);
				this.next();
			} else {
				// this.page(title, callback, options)
				// next[1] : title
				// next[3] : options
				// [ {String}API_URL, {String}title or {Object}page_data ]
				wiki_API.page(is_api_and_title(next[1]) ? next[1] : [
						this.API_URL, next[1] ],
				//
				function wiki_API_next_page_callback(page_data, error) {
					// assert: 當錯誤發生，例如頁面不存在/已刪除，依然需要模擬出 page_data。
					// 如此才能執行 .page().edit()。
					_this.last_page
					// 正常情況。確保this.last_page為單頁面。需要使用callback以取得result。
					= Array.isArray(page_data) ? page_data[0] : page_data;
					// next[2] : callback
					if (typeof next[2] === 'function')
						next[2].call(_this, page_data, error);
					_this.next();
				},
				// next[3] : options
				Object.assign({
					// [KEY_SESSION]
					session : this
				}, next[3]));
			}
			break;

		case 'parse':
			// e.g., wiki.page('title').parse();
			// next[1] : options
			page_parser(this.last_page, next[1]);
			break;

		case 'purge':
			if (typeof next[1] === 'string' || typeof next[1] === 'number') {
				// purge() 可以直接輸入頁面，不必先 .page('Title')
				// wiki.purge('Title', callback, options)
				// wiki.purge('Title', options)
				// wiki.purge(pageid, callback, options)
				// wiki.purge('pageid|pageid', options)
			} else {
				// wiki.page('Title').purge()
				// wiki.page('Title').purge(callback, options)
				// wiki.page('Title').purge(options)
				next.splice(1, 0, this.last_page);
			}

			if (library_namespace.is_Object(next[2]) && !next[3]) {
				// 直接輸入 options，未輸入 callback。
				next.splice(2, 0, null);
			}

			// next: [ 'purge', pages, callback, options ]

			if (!next[1]) {
				library_namespace
						.warn('wiki_API.prototype.next.purge: No page inputed!');
				// next[3] : callback
				if (typeof next[3] === 'function') {
					next[3].call(_this, undefined, 'no page');
				}
				this.next();

			} else {
				wiki_API.purge([ this.API_URL, next[1] ],
				//
				function wiki_API_next_purge_callback(purge_pages, error) {
					// next[2] : callback
					if (typeof next[2] === 'function') {
						next[2].call(_this, purge_pages, error);
					}
					_this.next();
				},
				// next[3] : options
				Object.assign({
					// [KEY_SESSION]
					session : this
				}, next[3]));
			}
			break;

		case 'redirect_to':
			// this.redirect_to(page data, callback, options);
			if (library_namespace.is_Object(next[2]) && !next[3]) {
				// 直接輸入 options，未輸入 callback。
				next.splice(2, 0, null);
			}

			// this.redirect_to(title, callback, options)
			// next[1] : title
			// next[3] : options
			// [ {String}API_URL, {String}title or {Object}page_data ]
			wiki_API.redirect_to(is_api_and_title(next[1]) ? next[1] : [
					this.API_URL, next[1] ],
			//
			function wiki_API_next_redirect_to_callback(redirect_data,
					page_data, error) {
				// next[2] : callback
				if (typeof next[2] === 'function') {
					next[2].call(_this, redirect_data, page_data, error);
				}
				_this.next();
			},
			// next[3] : options
			Object.assign({
				// [KEY_SESSION]
				session : this
			}, next[3]));
			break;

		case 'list':
			// get_list(). e.g., 反向連結/連入頁面。

			// next[1] : 大部分是 page title,
			// 但因為有些方法不需要用到頁面標題(recentchanges,allusers)因此對於這一些方法需要特別處理。
			if (typeof next[1] === 'function' && typeof next[2] !== 'function') {
				next.splice(1, 0, '');
			}

			// 注意: arguments 與 get_list() 之 callback 連動。
			wiki_API[list_type]([ this.API_URL, next[1] ],
			//
			function wiki_API_next_list_callback(pages, titles, title) {
				// [ last_list ]
				_this.last_titles = titles;
				// [ page_data ]
				_this.last_pages = pages;

				if (typeof next[2] === 'function') {
					// 注意: arguments 與 get_list() 之 callback 連動。
					// next[2] : callback(pages, titles, title)
					next[2].call(_this, pages, titles, title);
				} else if (next[2] && next[2].each) {
					// next[2] : 當作 work，處理積存工作。
					if (pages) {
						_this.work(next[2]);
					} else {
						// 只有在本次有處理頁面時，才繼續下去。
						library_namespace.info('無頁面可處理（已完成？），中斷跳出。');
					}
				}

				_this.next();
			},
			// next[3] : options
			Object.assign({
				// [KEY_SESSION]
				session : this
			}, this.next_mark, next[3]));
			break;

		case 'search':
			wiki_API.search([ this.API_URL, next[1] ],
			//
			function wiki_API_search_callback(pages, totalhits, key) {
				// undefined || [ page_data ]
				_this.last_pages = pages;
				// 設定/紀錄後續檢索用索引值。
				// 若是將錯誤的改正之後，應該重新自 offset 0 開始 search。
				// 因此這種情況下基本上不應該使用此值。
				if (pages && pages.sroffset)
					_this.next_mark.sroffset = pages.sroffset;

				if (typeof next[2] === 'function') {
					// next[2] : callback(...)
					next[2].call(_this, pages || [], totalhits, key);
				} else if (next[2] && next[2].each) {
					// next[2] : 當作 work，處理積存工作。
					// next[2].each(page_data, messages, config)
					_this.work(next[2]);
				}

				_this.next();
			},
			// next[3] : options
			Object.assign({
				// [KEY_SESSION]
				session : this
			}, next[3]));
			break;

		case 'check':
			// 正規化並提供可隨意改變的同內容參數，以避免修改或覆蓋附加參數。
			next[1] = library_namespace.new_options(this.check_options,
			// next[1]: options
			typeof next[1] === 'boolean' ? {
				force : next[1]
			} : typeof options === 'string' ? {
				title : next[1]
			} : next[1]);

			// ('stopped' in this): 已經有 cache。
			if (('stopped' in this)
			// force to check
			&& next[1].force) {
				library_namespace.debug('Skip check_stop().', 1,
						'wiki_API.prototype.next');
				this.next();
			} else {
				library_namespace.debug('以 .check_stop() 檢查與設定是否須停止編輯作業。', 1,
						'wiki_API.prototype.next');
				library_namespace
						.debug('Using options to call check_stop(): '
								+ JSON.stringify(next[1]), 2,
								'wiki_API.prototype.next');
				next[1].token = this.token;
				// 正作業中之 wiki_API instance。
				next[1][KEY_SESSION] = this;
				wiki_API.check_stop(function(stopped) {
					// cache
					_this.stopped = stopped;

					_this.next();
				},
				// next[1] : options
				next[1]);
			}
			break;

		case 'copy_from':
			wiki_API_prototype_copy_from.apply(this, next.slice(1));
			break;

		case 'edit':
			// wiki.edit(page contents, options, callback)
			if (typeof next[2] === 'string') {
				// wiki.edit(page contents, summary, callback)
				next[2] = {
					summary : next[2]
				};
			}

			// TODO: {String|RegExp|Array}filter
			if (!this.last_page) {
				library_namespace
						.warn('wiki_API.prototype.next: No page in the queue. You must run .page() first!');
				// next[3] : callback
				if (typeof next[3] === 'function') {
					next[3].call(_this, undefined, 'no page');
				}
				this.next();

			} else if (!('stopped' in this)) {
				library_namespace.debug('rollback, check if need stop 緊急停止.',
						2, 'wiki_API.prototype.next');
				this.actions.unshift([ 'check' ], next);
				this.next();
			} else if (this.stopped && !next[2].skip_stopped) {
				library_namespace.warn('wiki_API.prototype.next: 已停止作業，放棄編輯'
						+ get_page_title_link(this.last_page) + '！');
				// next[3] : callback
				if (typeof next[3] === 'function')
					next[3].call(this, this.last_page.title, '已停止作業');
				this.next();

			} else if (this.last_page.is_Flow) {
				// next[2]: options to call edit_topic()
				// .section: 章節編號。 0 代表最上層章節，new 代表新章節。
				if (next[2].section !== 'new') {
					library_namespace
							.warn('wiki_API.prototype.next: The page to edit is Flow. I can not edit it directly.');
					// next[3] : callback
					if (typeof next[3] === 'function') {
						// 2017/9/18 Flow已被重新定義為結構化討論 / 結構式討論。
						// is [[mw:Structured Discussions]].
						next[3].call(this, this.last_page.title, 'is Flow');
					}
					this.next();

				} else if (!this.last_page.header) {
					// rollback
					this.actions.unshift(next);
					// 先取得關於討論板的描述。以此為依據，檢測頁面是否允許機器人帳戶訪問。
					Flow_page(this.last_page, function() {
						// next[3] : callback
						if (typeof next[3] === 'function')
							next[3].call(this, this.last_page.title);
						// 因為已經更動過內容，為了預防會取得舊的錯誤資料，因此將之刪除。但留下標題資訊。
						delete _this.last_page.revisions;
						_this.next();
					}, {
						flow_view : 'header',
						// [KEY_SESSION]
						session : this
					});

				} else if ((!next[2] || !next[2].ignore_denial)
						&& wiki_API.edit.denied(this.last_page,
								this.token.lgname, next[2]
										&& next[2].notification)) {
					// {{bot}} support for flow page
					// 採用 this.last_page 的方法，
					// 在 multithreading 下可能因其他 threading 插入而造成問題，須注意！
					library_namespace
							.warn('wiki_API.prototype.next: Denied to edit flow '
									+ get_page_title_link(this.last_page));
					// next[3] : callback
					if (typeof next[3] === 'function')
						next[3].call(this, this.last_page.title, 'denied');
					this.next();

				} else {
					library_namespace.debug('直接採用 Flow 的方式增添新話題。');
					// use/get the contents of this.last_page
					if (typeof next[1] === 'function') {
						// next[1] = next[1](get_page_content(this.last_page),
						// this.last_page.title, this.last_page);
						// 需要同時改變 wiki_API.edit！
						// next[2]: options to call edit_topic()
						// .call(options,): 使(回傳要編輯資料的)設定值函數能以this即時變更 options。
						next[1] = next[1].call(next[2], this.last_page);
					}
					edit_topic([ this.API_URL, this.last_page ],
					// 新章節/新話題的標題文字。
					next[2].sectiontitle,
					// 新話題最初的內容。因為已有 contents，直接餵給轉換函式。
					// [[mw:Flow]] 會自動簽名，因此去掉簽名部分。
					next[1].replace(/[\s\n\-]*~~~~[\s\n\-]*$/, ''),
					//
					this.token,
					// next[2]: options to call edit_topic()
					Object.assign({
						// [KEY_SESSION]
						session : this
					}, next[2]), function(title, error, result) {
						// next[3] : callback
						if (typeof next[3] === 'function')
							next[3].call(_this, title, error, result);
						// 因為已經更動過內容，為了預防會取得舊的錯誤資料，因此將之刪除。但留下標題資訊。
						delete _this.last_page.revisions;
						_this.next();
					});
				}

			} else if ((!next[2] || !next[2].ignore_denial)
					&& wiki_API.edit.denied(this.last_page, this.token.lgname,
							next[2] && next[2].notification)) {
				// 採用 this.last_page 的方法，
				// 在 multithreading 下可能因其他 threading 插入而造成問題，須注意！
				library_namespace
						.warn('wiki_API.prototype.next: Denied to edit '
								+ get_page_title_link(this.last_page));
				// next[3] : callback
				if (typeof next[3] === 'function')
					next[3].call(this, this.last_page.title, 'denied');
				this.next();

			} else {
				if (typeof next[1] === 'function') {
					// next[1] = next[1](get_page_content(this.last_page),
					// this.last_page.title, this.last_page);
					// 需要同時改變 wiki_API.edit！
					// next[2]: options to call edit_topic()
					// .call(options,): 使(回傳要編輯資料的)設定值函數能以this即時變更 options。
					next[1] = next[1].call(next[2], this.last_page);
				}
				if (next[2] && next[2].skip_nochange
				// 採用 skip_nochange 可以跳過實際 edit 的動作。
				&& next[1] === get_page_content(this.last_page)) {
					library_namespace.debug('Skip [' + this.last_page.title
							+ ']: The same contents.', 1,
							'wiki_API.prototype.next');
					// next[3] : callback
					if (typeof next[3] === 'function')
						next[3].call(this, this.last_page.title, 'nochange');
					this.next();
				} else {
					wiki_API.edit([ this.API_URL, this.last_page ],
					// 因為已有 contents，直接餵給轉換函式。
					next[1], this.token,
					// next[2]: options to call wiki_API.edit()
					Object.assign({
						// [KEY_SESSION]
						session : this
					}, next[2]), function wiki_API_next_edit_callback(title,
							error, result) {
						// 當運行過多次，就可能出現 token 不能用的情況。需要重新 get token。
						if (result ? result.error
						//
						? result.error.code === 'badtoken'
						// 有時 result 可能會是 ""，或者無 result.edit。這通常代表 token lost。
						: !result.edit : result === '') {
							// Invalid token
							library_namespace.warn(
							//
							'wiki_API.prototype.next: ' + _this.language
							//
							+ ': It seems we lost the token. 似乎丟失了 token。');
							if (!library_namespace.platform.nodejs) {
								library_namespace
										.error('wiki_API.prototype.next: '
												+ 'Not using nod.js!');
								return;
							}
							// 下面的 workaround 僅適用於 node.js。
							if (!_this.token.lgpassword) {
								library_namespace
										.error('wiki_API.prototype.next: '
												+ 'No password preserved!');
								// 死馬當活馬醫，仍然嘗試重新取得 token...沒有密碼無效。
								return;
							}
							library_namespace.info('wiki_API.prototype.next: '
									+ 'Try to get token again. 嘗試重新取得 token。');
							// rollback
							_this.actions.unshift(
							// 重新登入以後，編輯頁面之前再取得一次頁面內容。
							[ 'page', _this.last_page.title ], next);
							// reset node agent.
							// 應付 2016/1 MediaWiki 系統更新，
							// 需要連 HTTP handler 都重換一個，重起 cookie。
							// 發現大多是因為一次處理數十頁面，可能遇上 HTTP status 413 的問題。
							setup_API_URL(_this /* session */, true);
							if (false && result === '') {
								// force to login again: see wiki_API.login
								delete _this.token.csrftoken;
								delete _this.token.lgtoken;
								// library_namespace.set_debug(6);
							}
							// TODO: 在這即使 rollback 了 action，
							// 還是可能出現丟失 this.last_page 的現象。
							// e.g., @ 20160517.解消済み仮リンクをリンクに置き換える.js

							// 直到 .edit 動作才會出現 badtoken，
							// 因此在 wiki_API.login 尚無法偵測是否 badtoken。
							if ('retry_login' in _this) {
								if (++_this.retry_login > 2) {
									throw new Error(
									// 當錯誤 login 太多次時，直接跳出。
									'wiki_API.next: Too many failed login attempts: ['
											+ _this.token.lgname + ']');
								}
								library_namespace.info('wiki_API.next: Retry '
										+ _this.retry_login);
							} else {
								_this.retry_login = 0;
							}

							// 重新取得 token。
							wiki_API.login(_this.token.lgname,
							//
							_this.token.lgpassword, {
								force : true,
								// [KEY_SESSION]
								session : _this,
								// 將 'login' 置於最前頭。
								login_mark : true
							});

						} else {
							if ('retry_login' in _this)
								// 已成功 edit，去除 retry flag。
								delete _this.retry_login;
							// next[3] : callback
							if (typeof next[3] === 'function')
								next[3].call(_this, title, error, result);
							// assert: 應該有_this.last_page。
							// 因為已經更動過內容，為了預防會取得舊的錯誤資料，因此將之刪除。但留下標題資訊。
							if (_this.last_page) {
								delete _this.last_page.revisions;
							}
							_this.next();
						}
					});
				}
			}
			break;

		case 'upload':
			if (next[2]) {
				if (typeof next[2] === 'string') {
					next[2] = {
						comment : next[2]
					};
				}
			}

			// wiki.upload(file_path, options, callback)
			wiki_API.upload(next[1], this.token.csrftoken,
			// next[2]: options to call wiki_API.edit()
			Object.assign({
				// [KEY_SESSION]
				session : this
			}, next[2]), function(result, error) {
				// next[3] : callback
				if (typeof next[3] === 'function')
					next[3].call(_this, result, error);
				_this.next();
			});
			break;

		case 'cache':
			if (library_namespace.is_Object(next[2]) && !next[3]) {
				// 未設定/不設定 callback
				// shift arguments
				next.splice(2, 0, undefined);
			}

			// 因為 wiki_API.cache(list) 會使用到 wiki_API.prototype[method]，
			// 算是 .next() 編制外功能；
			// 因此需要重新設定 this.running，否則可能中途停止。
			// 例如 this.running = true，但是實際上已經不會再執行了。
			// TODO: 這可能會有bug。
			this.running = 0 < this.actions.length;

			// wiki.cache(operation, callback, _this);
			wiki_API.cache(next[1], function() {
				// overwrite callback() to run this.next();
				// next[2] : callback
				if (typeof next[2] === 'function')
					next[2].apply(_this, arguments);
				// 因為 wiki_API.cache(list) 會使用到 wiki_API.prototype[method]；
				// 其最後會再 call wiki_API.next()，是以此處不再重複 call .next()。
				// _this.next();
			},
			// next[3]: options to call wiki_API.cache()
			Object.assign({
				// default options === this

				// including main, File, Template, Category
				// namespace : '0|6|10|14',

				// title_prefix : 'Template:',

				// cache path prefix
				// prefix : base_directory,

				// [KEY_SESSION]
				session : this
			}, next[3]));
			break;

		case 'listen':
			// 因為接下來的操作會呼叫 this.next() 本身，
			// 因此必須把正在執行的標記特消掉。
			this.running = false;
			add_listener(next[1],
			// next[2]: options to call wiki_API.listen()
			Object.assign({
				// [KEY_SESSION]
				session : this
			}, next[2]));
			break;

		// ------------------------------------------------
		// Wikidata access

		case 'data':
			if (!('data_session' in this)) {
				// rollback, 確保已設定 this.data_session。
				this.actions.unshift([ 'set_data' ], next);
				this.next();
				break;
			}

			if (typeof next[1] === 'function') {
				library_namespace.debug('直接將last_data輸入 callback: ' + next[1],
						3, 'wiki_API.prototype.next.data');
				if (last_data_is_usable(this)) {
					next[1].call(this, this.last_data);
					this.next();
					break;
				} else {
					library_namespace.debug('last data 不能用。', 3,
							'wiki_API.prototype.next.data');
					// delete this.last_data;
					if (!this.last_page) {
						next[1].call(this, undefined, {
							code : 'no_id',
							message : 'Did not set id! 未設定欲取得之特定實體id。'
						});
						this.next();
						break;
					}
					next.splice(1, 0, this.last_page);
				}
			}

			if (typeof next[2] === 'function') {
				// 未設定/不設定 property
				// shift arguments
				next.splice(2, 0, null);
			}

			// 因為前面利用cache時會檢查KEY_CORRESPOND_PAGE，且KEY_CORRESPOND_PAGE只會設定在page_data，
			// 因此這邊自屬於page_data之輸入項目設定 .last_page
			if (get_page_content.is_page_data(next[1])
			// 預防把 wikidata entity 拿來當作 input 了。
			&& !is_entity(next[1])) {
				this.last_page = next[1];
			}
			// wikidata_entity(key, property, callback, options)
			wikidata_entity(next[1], next[2], function(data, error) {
				// 就算發生錯誤，依然設定一個 dummy，預防 edit_data 時引用可能非所欲的 this.last_page。
				_this.last_data = data || {
					key : next[1],
					error : error
				};
				if (false) {
					// 因為在wikidata_entity()裡面設定了[KEY_SESSION]，因此JSON.stringify()會造成:
					// TypeError: Converting circular structure to JSON
					library_namespace.debug('設定 entity data: '
							+ JSON.stringify(_this.last_data), 3,
							'wiki_API.prototype.next.data');
				}
				// next[3] : callback
				if (typeof next[3] === 'function') {
					next[3].call(this, data, error);
				}
				_this.next();
			},
			// next[4] : options
			Object.assign({
				// [KEY_SESSION]
				session : this.data_session
			}, next[4]));
			break;

		case 'edit_data':
			if (!('data_session' in this)) {
				// rollback, 確保已設定 this.data_session。
				this.actions.unshift([ 'set_data' ], next);
				this.next();
				break;
			}

			// wiki.edit_data([id, ]data[, options, callback])

			if (typeof next[1] === 'function'
			//
			|| library_namespace.is_Object(next[1]) && !is_entity(next[1])) {
				library_namespace.debug('未設定/不設定 id，第一個 next[1] 即為 data。', 6,
						'wiki_API.next.edit_data');
				// next = [ 'edit_data', data[, options, callback] ]
				if (library_namespace.is_Object(next[2]) && next[2]['new']) {
					// create item/property
					next.splice(1, 0, null);

				} else {
					// 自動填補 id。
					// 直接輸入 callback。
					if (typeof next[2] === 'function' && !next[3]) {
						// 未輸入 options，但輸入 callback。
						next.splice(2, 0, null);
					}

					// next = [ 'edit_data', data, options[, callback] ]

					if (false) {
						// TypeError: Converting circular structure to JSON
						library_namespace.debug('this.last_data: '
								+ JSON.stringify(this.last_data), 6,
								'wiki_API.next.edit_data');
						library_namespace.debug('this.last_page: '
								+ JSON.stringify(this.last_page), 6,
								'wiki_API.next.edit_data');
					}
					if (last_data_is_usable(this)) {
						// shift arguments
						next.splice(1, 0, this.last_data);

					} else if (this.last_data && this.last_data.error
					// @see last_data_is_usable(session)
					&& this.last_page === this.last_data[KEY_CORRESPOND_PAGE]) {
						library_namespace.debug('前一次之wikidata實體取得失敗', 6,
								'wiki_API.next.edit_data');
						next[3] && next[3].call(this, undefined, {
							code : 'last_data_failed',
							message : '前一次之wikidata實體取得失敗: ['
							// 例如提供的 foreign title 錯誤，
							+ (this.last_data[KEY_CORRESPOND_PAGE]
							// 或是 foreign title 為 redirected。
							|| (this.last_data.site
							// 抑或者存在 foreign title 頁面，但沒有 wikidata entity。
							+ ':' + this.last_data.title)) + ']'
						});
						this.next();
						break;

					} else if (this.last_page) {
						library_namespace.debug('自 .last_page '
								+ get_page_title_link(this.last_page)
								+ ' 取得特定實體。', 6, 'wiki_API.next.edit_data');
						// e.g., edit_data({Function}data)
						next.splice(1, 0, this.last_page);

					} else {
						next[3] && next[3].call(this, undefined, {
							code : 'no_id',
							message : 'Did not set id! 未設定欲取得之特定實體id。'
						});
						this.next();
						break;
					}
				}
			}

			// needless: 會從 get_data_API_URL(options) 取得 API_URL。
			if (false && !Array.isArray(next[1])) {
				// get_data_API_URL(this)
				next[1] = [ this.data_session.API_URL, next[1] ];
			}

			// next = [ 'edit_data', id, data[, options, callback] ]
			if (typeof next[3] === 'function' && !next[4]) {
				// 未輸入 options，但輸入 callback。
				next.splice(3, 0, null);
			}

			// 因為前面利用cache時會檢查KEY_CORRESPOND_PAGE，且KEY_CORRESPOND_PAGE只會設定在page_data，
			// / / 因此這邊自屬於page_data之輸入項目設定 .last_page
			if (get_page_content.is_page_data(next[1])
			// 預防把 wikidata entity 拿來當作 input 了。
			&& !is_entity(next[1])) {
				this.last_page = next[1];
			}
			// wikidata_edit(id, data, token, options, callback)
			wikidata_edit(next[1], next[2], this.data_session.token,
			// next[3] : options
			Object.assign({
				// [KEY_SESSION]
				session : this.data_session
			}, next[3]),
			// callback
			function(data, error) {
				if (false && data && !is_entity(data)) {
					console.trace(data);
					throw 'data is NOT entity';
				}
				_this.last_data = data || {
					// 有發生錯誤:設定 error log Object。
					last_data : _this.last_data,
					key : next[1],
					error : error
				};
				// next[4] : callback
				if (typeof next[4] === 'function') {
					next[4].call(this, data, error);
				}
				_this.next();
			});
			break;

		case 'merge_data':
			if (!('data_session' in this)) {
				// rollback, 確保已設定 this.data_session。
				this.actions.unshift([ 'set_data' ], next);
				this.next();
				break;
			}

			// next = [ 'merge_data', to, from[, options, callback] ]
			if (typeof next[3] === 'function' && !next[4]) {
				// 未輸入 options，但輸入 callback。
				next.splice(3, 0, null);
			}

			// next = [ 'merge_data', to, from, options[, callback] ]
			wikidata_merge(next[1], next[2], this.data_session.token,
			// next[3] : options
			Object.assign({
				// [KEY_SESSION]
				session : this.data_session
			}, next[3]),
			// next[4] : callback
			function(data, error) {
				// 此 wbmergeitems 之回傳 data 不包含 item 資訊。
				// next[4] : callback
				if (typeof next[4] === 'function') {
					next[4].call(this, data, error);
				}
				_this.next();
			});
			break;

		case 'query_data':
			// wdq, query data
			// wikidata_query(query, callback, options)
			wikidata_query(next[1], function(data) {
				_this.last_list = Array.isArray(data) ? data : null;
				// next[2] : callback
				if (typeof next[2] === 'function')
					next[2].call(this, data);
				_this.next();
			}, next[3]);
			break;

		// ------------------------------------------------

		// administrator functions

		case 'move_to':
			// wiki.page(from title)
			// .move_to(to, [from title,] options, callback)

			// wiki.move_to(to, from, options, callback)
			// wiki.move_to(to, from, options)
			// wiki.move_to(to, from, callback)
			// wiki.move_to(to, from)

			// wiki.page(from).move_to(to, options, callback)
			// wiki.page(from).move_to(to, options)
			// wiki.page(from).move_to(to, callback)
			// wiki.page(from).move_to(to)

			if (type === 'move_to') {
				var move_to_title;
				if (typeof next[1] === 'string') {
					move_to_title = next[1];
					// shift arguments
					next.splice(1, 1);
				}
			}

		case 'remove':
			// wiki.page(title).remove([title,] options, callback)
			if (type === 'remove') {
				// 正名。
				type = 'delete';
			}
		case 'delete':
			// wiki.page(title).delete([title,] options, callback)

		case 'protect':
			// wiki.page(title).protect([title,] options, callback)

		case 'rollback':
			// wiki.page(title).rollback([title,] options, callback)

			// --------------------------------------------

			// 這些控制用的功能，不必須取得頁面內容。
			if (typeof next[1] === 'string') {
				// 輸入的第一個參數是頁面標題。
				// e.g.,
				// wiki.remove(title, options, callback)
				this.last_page = {
					title : next[1]
				};
				// shift arguments
				next.splice(1, 1);
			}

			if (typeof next[1] === 'function') {
				// shift arguments
				// insert as options
				next.splice(1, 0, undefined);
			}
			if (!next[1]) {
				// initialize options
				next[1] = Object.create(null);
			}

			if (type === 'move_to') {
				if (move_to_title) {
					next[1].to = move_to_title;
				}
			}

			// 保護/回退
			if (this.stopped && !next[1].skip_stopped) {
				library_namespace.warn('wiki_API.prototype.next: 已停止作業，放棄 '
				//
				+ type + ' [['
				//
				+ (next[1].title || next[1].pageid || this.last_page
				//
				&& this.last_page.title) + ']]！');
				// next[2] : callback
				if (typeof next[2] === 'function')
					next[2].call(this, next[1], '已停止作業');
				this.next();

			} else {
				next[1][KEY_SESSION] = this;
				wiki_API[type](next[1], function(response, error) {
					// next[2] : callback
					if (typeof next[2] === 'function')
						next[2].call(_this, response, error);
					_this.next();
				});
			}
			break;

		// ------------------------------------------------
		// 流程控制

		case 'wait':
			// rollback
			this.actions.unshift(next);
			break;

		case 'run':
			// next[1] : callback
			if (typeof next[1] === 'function')
				next[1].call(this, next[2]);
			this.next();
			break;

		// ------------------------------------------------

		default:
			library_namespace.error('Unknown operation: [' + next.join() + ']');
			this.next();
			break;
		}

	};

	/**
	 * wiki_API.prototype.next() 已登記之 methods。<br />
	 * 之後會再自動加入 get_list.type 之 methods。<br />
	 * NG: ,login
	 * 
	 * @type {Array}
	 */
	wiki_API.prototype.next.methods = 'query_API|siteinfo|page|parse|redirect_to|purge|check|copy_from|edit|upload|cache|listen|search|remove|delete|move_to|protect|rollback|logout|run|set_URL|set_language|set_data|data|edit_data|merge_data|query_data|query'
			.split('|');

	// ------------------------------------------------------------------------

	// 或者還可以去除 "MediaWiki message delivery" 這些系統預設的非人類發布者。
	/** {RegExp}pattern to test if is a robot name. CeL.wiki.PATTERN_BOT_NAME */
	var PATTERN_BOT_NAME = /bot(?:$|[^a-z])|[機机][器械]人|ボット(?:$|[^a-z])|봇$/i;
	// ↑ /(?:$|[^a-z])/: e.g., PxBot~testwiki, [[ko:User:2147483647 (bot)]],
	// a_bot2, "DynBot Srv2", "Kwjbot II", "Purbo T"
	// TODO: [[User:CommonsDelinker]], BotMultichill, "Flow talk page manager",
	// "Maintenance script", "MediaWiki default", "MediaWiki message delivery"

	/**
	 * default date format. 預設的日期格式
	 * 
	 * @type {String}
	 * @see ISO 8601
	 */
	wiki_API.prototype.date_format = '%4Y%2m%2dT%2H%2M';

	var default_continue_key = 'Continue key';
	/** {String}後續索引。後續檢索用索引值標記名稱。 */
	wiki_API.prototype.continue_key = default_continue_key;

	/**
	 * 規範 log 之格式。(for wiki_API.prototype.work)
	 * 
	 * 若有必要跳過格式化的訊息，應該自行調用 message.push({String}message) 而非
	 * message.add({String}message)。
	 * 
	 * @param {String}message
	 *            message
	 * @param {String}[title]
	 *            message title.
	 * @param {Boolean}[use_ordered_list]
	 *            use ordered list.
	 */
	function add_message(message, title, use_ordered_list) {
		if (typeof message !== 'string') {
			message = message && String(message) || '';
		}
		if (message = message.trim()) {
			this.push((use_ordered_list ? '# ' : '* ')
					+ (title && (title = get_page_title_link(title))
					// 對於非條目作特殊處理。
					? /^\[\[[^\[\]\|{}\n#�:]+:/.test(title) ? "'''" + title
							+ "''' " : title + ' ' : '') + message);
		}
	}

	function reset_messages() {
		// 設定 time stamp。
		this.start = this.last = new Date;
		// clear
		this.clear();
	}

	/**
	 * 輸入 URI component list，得出自 [0] 至 [邊際index-1] 以 encodeURIComponent()
	 * 串聯起來，長度不超過 limit_length。
	 * 
	 * @param {Array}piece_list
	 *            URI component list
	 * @param {Natural}[limit]
	 *            limit index
	 * @param {Natural}[limit_length]
	 *            limit length
	 * 
	 * @returns {Number}邊際index。
	 */
	function check_max_length(piece_list, limit, limit_length) {
		// 8000: 8192 - (除了 piece_list 外必要之字串長)。
		//
		// 8192: https://httpd.apache.org/docs/current/mod/core.html
		// defaule LimitRequestLine: 8190
		//
		// assert: 除了 piece_list 外必要之字串長 < 192
		// e.g.,
		// "https://zh.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content|timestamp&titles=...&format=json&utf8=1"
		if (!(limit_length >= 0)) {
			limit_length = 8000;
		}
		if (false && !(limit >= 0)) {
			limit = 5000;
		}

		var length = 0, index = piece_list.length;

		if (false)
			piece_list.slice(0, limit_length / 30).join('|').slice(0,
					limit_length).replace(/[^|]+$/, '');

		piece_list.some(function(piece, i) {
			// +3 === encodeURIComponent('|').length: separator '|'
			length += encodeURIComponent(piece).length + 3;
			if (i >= limit || length >= limit_length) {
				index = i;
				return true;
			}
		});
		CeL.debug('0–' + index + ': length ' + length, 4, 'check_max_length');

		return index;
	}

	// wiki_API.prototype.work(config): configuration:
	({
		// 注意: 與 wiki_API.prototype.work(config)
		// 之 config.before/config.after 連動。
		before : function(messages, pages, titles) {
		},
		// {Function|Array} 每個 page 執行一次。
		each : function(page_data, messages) {
			return 'text to replace';
		},
		// 注意: 與 wiki_API.prototype.work(config)
		// 之 config.before/config.after 連動。
		after : function(messages, pages, titles) {
		},
		// run this at last. 在wiki_API.prototype.work()工作最後執行此config.last()。
		last : function() {
		},
		// 不作編輯作業。
		no_edit : true,
		// 設定寫入目標。一般為 debug、test 測試期間用。
		write_to : '',
		/** {String}運作記錄存放頁面。 */
		log_to : 'User:Robot/log/%4Y%2m%2d',
		// 「新條目、修飾語句、修正筆誤、內容擴充、排版、內部鏈接、分類、消歧義、維基化」
		/** {String}編輯摘要。總結報告。編輯理由。 edit reason. */
		summary : ''
	});

	/**
	 * robot 作業操作之輔助套裝函數。此函數可一次取得50至300個頁面內容再批次處理。<br />
	 * 不會推入 this.actions queue，即時執行。因此需要先 get list！
	 * 
	 * @param {Object}config
	 *            configuration
	 * @param {Array}pages
	 *            page data list
	 * @param {Array}[titles]
	 *            title list
	 */
	wiki_API.prototype.work = function(config, pages, titles) {
		if (typeof config === 'function')
			config = {
				each : config
			};
		if (!config || !config.each) {
			library_namespace.warn('wiki_API.work: Bad callback!');
			return;
		}

		if (!pages)
			pages = this.last_pages, titles = this.last_titles;
		// config.run_empty: 即使無頁面/未取得頁面，依舊強制執行下去。
		if (!pages && !titles && !config.run_empty) {
			// 採用推入前一個 this.actions queue 的方法，
			// 在 multithreading 下可能因其他 threading 插入而造成問題，須注意！
			library_namespace
					.warn('wiki_API.work: No list. Please get list first!');
			return;
		}

		library_namespace.debug('wiki_API.work: 開始執行:先作環境建構與初始設定。');
		if (config.summary) {
			// '開始處理 ' + config.summary + ' 作業'
			library_namespace.sinfo([ 'wiki_API.work: start [', 'fg=yellow',
					config.summary, '-fg', ']' ]);
		}

		/**
		 * <code>
		 * default handler [ text replace function(title, content), {Object}options, callback(title, error, result) ]
		 * </code>
		 */
		var each,
		// options 在此暫時作為 default options。
		options = config.options || {
			// Throw an error if the page doesn't exist.
			// 若頁面不存在/已刪除，則產生錯誤。
			// 要取消這項，須注意在重定向頁之對話頁操作之可能。
			nocreate : 1,
			// 該編輯是一個小修訂 (minor edit)。
			minor : 1,
			// 標記此編輯為機器人編輯。[[WP:AL|機器人對其他使用者對話頁的小修改將不會觸發新訊息提示]]。
			bot : 1,
			// [[Special:tags]]
			// tags : 'bot|test',
			// 設定寫入目標。一般為 debug、test 測試期間用。
			write_to : '',
			// 採用 skip_nochange 可以跳過實際 edit 的動作。
			// 對於大部分不會改變頁面的作業，能大幅加快速度。
			skip_nochange : true
		}, callback,
		/** {ℕ⁰:Natural+0}全無變更頁面數。 */
		nochange_count = 0;

		if (typeof config.each === 'function') {
			// {Function}
			each = [ config.each ];
			if (!config.options) {
				// 直接將 config 的設定導入 options。
				// e.g., write_to
				for (callback in options) {
					if (callback in config) {
						if (!config[callback] && callback in {
							nocreate : 1,
							minor : 1,
							bot : 1
						}) {
							// 即使設定 minor=0 似乎也會當作設定了，得完全消滅才行。
							delete options[callback];
						} else
							options[callback] = config[callback];
					}
				}
			}

		} else if (Array.isArray(config.each)) {
			each = config;
		} else {
			library_namespace.error(
			//
			'wiki_API.work: Invalid function for each page!');
		}

		if (each[1]) {
			Object.assign(options, each[1]);
		}
		// 採用 {{tlx|template_name}} 時，[[Special:RecentChanges]]頁面無法自動解析成 link。
		options.summary = (callback = config.summary)
		// 是為 Robot 運作。
		? PATTERN_BOT_NAME.test(callback) ? callback
		// Robot: 若用戶名包含 'bot'，則直接引用之。
		: (this.token.lgname.length < 9
				&& PATTERN_BOT_NAME.test(this.token.lgname)
		//
		? this.token.lgname : 'Robot')
				+ ': ' + callback
		// 未設置時，一樣添附 Robot。
		: 'Robot';

		// assert: 因為要作排程，為預防衝突與不穩定的操作結果，自此以後不再 modify options。

		var done = 0,
		//
		log_item = Object.assign(Object.create(null),
				wiki_API.prototype.work.log_item, config.log_item),
		/** {Boolean}console 不顯示訊息，也不處理 {Array}messages。 */
		no_message = config.no_message, messages = [];
		messages.add = no_message ? library_namespace.null_function
				: add_message;
		messages.reset = no_message ? library_namespace.null_function
				: reset_messages;
		messages.reset();

		callback = each[2];
		// each 現在轉作為對每一頁面執行之工作。
		each = each[0];
		if (!callback) {
			// TODO: [[ja:Special:Diff/62546431|有時最後一筆記錄可能會漏失掉]]
			callback = no_message ? library_namespace.null_function
			// default logger.
			: function(title, error, result) {
				if (error) {
					// ((return [ CeL.wiki.edit.cancel, 'skip' ];))
					// 來跳過，不特別顯示或處理。
					// 被 skip/pass 的話，連警告都不顯現，當作正常狀況。
					if (error === 'skip') {
						done++;
						nochange_count++;
						return;
					}

					if (error === 'nochange') {
						done++;
						// 未經過 wiki 操作，於 wiki_API.edit 發現為[[WP:NULLEDIT|無改變]]的。
						// 無更動 沒有變更 No modification made
						nochange_count++;
						error = gettext('no change');
						result = 'nochange';
					} else {
						// 有錯誤發生。
						// e.g., [protectedpage]
						// The "editprotected" right is required to edit this
						// page
						result = [ 'error', error ];
						error = gettext('finished: %1', error);
					}
				} else if (!result || !result.edit) {
					// 有時 result 可能會是 ""，或者無 result.edit。這通常代表 token lost。
					library_namespace.error('wiki_API.work: 無 result.edit'
							+ (result && result.edit ? '.newrevid' : '')
							+ '！可能是 token lost！');
					error = 'no "result.edit'
							+ (result && result.edit ? '.newrevid".' : '.');
					result = [ 'error', 'token lost?' ];

				} else {
					// 成功完成。
					done++;
					if (result.edit.newrevid) {
						// https://en.wikipedia.org/wiki/Help:Wiki_markup#Linking_to_old_revisions_of_pages.2C_diffs.2C_and_specific_history_pages
						// https://zh.wikipedia.org/?diff=000
						// cf. [[Special:Permalink/0|title]],
						// [[Special:Diff/prev/0]]
						error = ' [[Special:Diff/' + result.edit.newrevid + '|'
						// may use get_page_title_link()
						+ gettext('finished') + ']]';
						result = 'succeed';
					} else if ('nochange' in result.edit) {
						// 經過 wiki 操作，發現為[[WP:NULLEDIT|無改變]]的。
						nochange_count++;
						error = gettext('no change');
						result = 'nochange';
					} else {
						// 有時無 result.edit.newrevid。
						library_namespace.error('無 result.edit.newrevid');
						error = gettext('finished');
						result = 'succeed';
					}
				}

				// error: message, result: result type.

				if (log_item[Array.isArray(result)
				// {Array}result = [ main error code, sub ]
				? result.join('_') in log_item ? result.join('_') : result[0]
						: result]) {
					error = gettext('%1 elapsed, %3 at %2',
					// 紀錄使用時間, 歷時, 費時, elapsed time
					messages.last.age(new Date), (messages.last = new Date)
					//
					.format(config.date_format || this.date_format), error);

					// 對各個條目的紀錄加入計數。
					messages.add(error, title, true);
				}
			};
		}

		if (Array.isArray(pages) && pages.slice(0, 10).every(function(item) {
			return typeof item === 'string';
		})) {
			// 傳入標題列表。
			messages.input_title_list = true;
		}

		if (false && Array.isArray(pages)
		//
		&& (Array.isArray(titles) ? pages.length !== titles.length : !titles)) {
			library_namespace.warn('wiki_API.work: rebuild titles.');
			titles = [];
			pages.forEach(function(page) {
				titles.push(page.title);
			});
		}

		// do a little check.
		if (Array.isArray(pages) && Array.isArray(titles)
		//
		&& pages.length !== titles.length) {
			library_namespace.warn(
			//
			'wiki_API.work: The length of pages and titles are different!');
		}

		var main_work = (function(data) {
			if (!Array.isArray(data)) {
				if (!data && this_slice_size === 0) {
					library_namespace.info('wiki_API.work: ' + config.summary
					// 任務/工作
					+ ': 未取得或設定任何頁面。這個部份的任務已完成？');
					data = [];
				} else {
					// 可能是 page data 或 title。
					data = [ data ];
				}
			}

			if (data.length !== this_slice_size) {
				// 處理有時可能連 data 都是 trimmed 過的。
				// assert: data.length < this_slice_size
				if (true || data.truncated) {
					if (!setup_target || library_namespace.is_debug())
						library_namespace.warn(
						//
						'wiki_API.work: query 所得之 length (' + data.length
						//
						+ ') !== this slice size (' + this_slice_size + ') ！');

					if (setup_target) {
						// -this_slice_size: 先回溯到 pages 開頭之 index。
						work_continue -= this_slice_size - data.length;
						library_namespace.debug('一次取得大量頁面時，回傳內容超過限度而被截斷。將回退 '
								+ (this_slice_size - data.length) + '頁。', 1,
								'wiki_API.work');
					}
				}
			}

			// 傳入標題列表，則由程式自行控制，毋須設定後續檢索用索引值。
			if (!messages.input_title_list
					// config.continue_session:
					// 後續檢索用索引值存儲所在的 {wiki_API}，將會以此 instance 之值寫入 log。
					&& (pages = 'continue_session' in config ? config.continue_session
							: this)
					// pages: 後續檢索用索引值之暫存值。
					&& (pages = pages.show_next())) {
				// 當有 .continue_session 時，其實用不到 log page 之 continue_key。
				if (!config.continue_session && !this
				// 忽略表示完結的紀錄，避免每個工作階段都顯示相同訊息。
				|| pages !== '{}'
				// e.g., 後続の索引: {"continue":"-||"}
				&& !/^{"[^"]+":"[\-|]{0,9}"}$/.test(pages)) {
					// console.log(config);
					// console.log(options);
					// console.log(this.continue_key + ':' +
					// JSON.stringify(pages));
					messages.add(this.continue_key + ': ' + pages);
				}
			}

			if (!no_message) {
				// 使用時間, 歷時, 費時, elapsed time
				pages = gettext('First, use %1 to get %2 pages.', messages.last
						.age(new Date), data.length);
				// 在「首先使用」之後才設定 .last，才能正確抓到「首先使用」。
				messages.last = new Date;
				if (log_item.get_pages) {
					messages.add(pages);
				}
				library_namespace.debug(pages, 2, wiki_API.work);
				if (library_namespace.is_debug()
				// .show_value() @ interact.DOM, application.debug
				&& library_namespace.show_value)
					library_namespace.show_value(data, 'pages');
			}

			pages = data;

			// run before every batch task. 在處理每個批次前執行此function。
			// 注意: 一次取得大量頁面時，回傳內容不一定會按照原先輸入的次序排列！
			// 若有必要，此時得用 config.before() 自行處理！
			if (typeof config.before === 'function') {
				// titles 可能為 undefined！
				// 注意: 與 wiki_API.prototype.work(config)
				// 之 config.before/config.after 連動。
				//
				// 2016/6/22 change API 應用程式介面變更:
				// .first(messages, titles, pages) → .before(messages, pages,
				// titles)
				// 按照需求程度編排 arguments，並改變適合之函數名。
				config.before.call(this, messages, pages, titles);
			}

			/**
			 * 處理回傳超過 limit (12 MB)，被截斷之情形。
			 * 
			 * @deprecated: 已經在 wiki_API.page 處理。
			 */
			if (false && ('continue' in pages)) {
				if (setup_target) {
					var continue_id = pages['continue'].rvcontinue
					// assert: pages['continue'].rvcontinue = 'id|...'。
					.match(/^\d+/)[0],
					// -pages.length: 先回溯到 pages 開頭之 index。
					effect_length = -(work_continue - pages.length);
					/**
					 * 找到 pages.continue 所指之 index。
					 */
					if (config.is_id) {
						// 須注意 type，有 number 1 !== string '1' 之問題。
						if (typeof target[--work_continue] === 'number')
							continue_id |= 0;
						// 從後頭搜尋比較快。
						work_continue = target.lastIndexOf(continue_id,
								work_continue);
						if (work_continue === NOT_FOUND) {
							throw new Error('page id not found: ' + continue_id);
						}
						// assert: 一定找得到。
						// work_continue≥pages開頭之index=(原work_continue)-pages.length
					} else {
						continue_id |= 0;
						while (pages[--work_continue].pageid !== continue_id)
							;
					}
					effect_length += work_continue;
					if (false) {
						console.log([ effect_length, pages.length,
								work_continue ]);
					}

					// assert: 0 < effect_length < pages.length
					library_namespace
							.debug('一次取得大量頁面時，回傳內容過長而被截斷。將回退 '
									+ (pages.length - effect_length)
									+ '頁，下次將自 ' + effect_length + '/'
									+ pages.length + ' '
									+ get_page_title_link(pages[effect_length])
									+ ' id ' + continue_id + ' 開始。', 1,
									'wiki_API.work');
					pages = pages.slice(0, effect_length);

				} else {
					library_namespace.error('wiki_API.work: 回傳內容過長而被截斷！');
				}
			}

			/**
			 * 處理回傳超過 limit (12 MB)，被截斷之情形。
			 */
			if ('OK_length' in pages) {
				if (setup_target) {
					// -pages.length: 先回溯到 pages 開頭之 index。
					work_continue -= pages.length - pages.OK_length;
				} else {
					library_namespace.error('wiki_API.work: 回傳內容超過限度而被截斷！');
				}

				library_namespace.debug('一次取得大量頁面時，回傳內容超過限度而被截斷。將回退 '
						+ (pages.length - pages.OK_length)
						+ '頁'
						+ (pages[pages.OK_length] ? '，下次將自 ' + pages.OK_length
								+ '/' + pages.length + ' '
								+ get_page_title_link(pages[pages.OK_length])
								+ ' id ' + pages[pages.OK_length].pageid
								+ ' 開始' : '') + '。', 1, 'wiki_API.work');
				pages = pages.slice(0, pages.OK_length);
			}

			library_namespace.debug('for each page: 主要機制是把工作全部推入 queue。', 2,
					'wiki_API.work');
			// 剩下的頁面數量 pages remaining. cf. ((done))
			var pages_left = 0;
			if (pages.length > 0) {
				pages.forEach(function for_each_page(page, index) {
					if (library_namespace.is_debug(2)
					// .show_value() @ interact.DOM, application.debug
					&& library_namespace.show_value)
						library_namespace.show_value(page, 'page');
					if (!page) {
						// nochange_count++;
						// Skip invalid page. 預防如 .work(['']) 的情況。
						return;
					}

					function clear_work() {
						// 警告: 直接清空 .actions 不安全！
						// this.actions.clear();
						work_continue = target.length;

						var next;
						while (next = this.actions[0]) {
							next = next[0];
							if (next === 'page' || next === 'edit')
								this.actions.shift();
							else
								break;
						}
						library_namespace.debug('清空 actions queue: 剩下'
								+ this.actions.length + ' actions。', 1,
								'wiki_API.work');
					}

					pages_left++;
					if (config.no_edit) {
						// 不作編輯作業。
						// 取得頁面內容。
						// console.log(page);
						this.page(page, function(page_data, error) {
							// TODO: if (error) {...}
							// console.log([ page_data, config.page_options ]);
							each.call(this, page_data, messages, config);
							if (messages.quit_operation) {
								clear_work.call(this);
							}
							if (--pages_left === 0) {
								finish_up.call(this);
							}
						}, single_page_options);

					} else {
						// clone() 是為了能個別改變 summary。
						// 例如: each() { options.summary += " -- ..."; }
						var work_options = Object.clone(options);
						// 取得頁面內容。一頁頁處理。
						this.page(page, null, single_page_options)
						// 編輯頁面內容。
						.edit(function(page_data) {
							// edit/process
							if (!no_message) {
								library_namespace.sinfo([
								//
								'wiki_API.work: edit '
								//
								+ (index + 1) + '/' + pages.length
								//
								+ ' [[', 'fg=yellow',
								//
								page_data.title, '-fg', ']]' ]);
							}
							// 以 each() 的回傳作為要改變成什麼內容。
							var content = each.call(
							// 注意: this === work_options
							// @see wiki_API.edit()
							this, page_data, messages, config);
							if (messages.quit_operation) {
								clear_work.call(this);
							}
							return content;
						}, work_options, function() {
							// function(title, error, result)
							callback.apply(this, arguments);
							if (--pages_left === 0) {
								finish_up.call(this);
							}
						});
					}
				}, this);

			} else {
				// 都沒有東西的時候依然應該執行收尾。
				finish_up.call(this);
			}

			// 警告：不可省略，只為避免clear_work()誤刪！
			this.run(function() {
				library_namespace.debug('工作配給完畢，等待 callback 結束，準備收尾。', 3,
						'wiki_API.work');
			});

			// 不應用 .run(finish_up)，而應在 callback 中呼叫 finish_up()。
			function finish_up() {
				if (!no_message) {
					library_namespace.debug('收尾。', 1, 'wiki_API.work');
					var count_summary;

					if (config.no_edit) {
						if (pages.length === target.length)
							count_summary = '';
						else
							count_summary = pages.length + '/';
					} else if (pages.length === target.length) {
						if (done === pages.length)
							count_summary = '';
						else
							count_summary = done + '/';
					} else {
						if (done === pages.length)
							count_summary = done + '//';
						else
							count_summary = done + '/' + pages.length + '//';
					}

					if (work_continue && work_continue < target.length) {
						count_summary += ' '
						//
						+ work_continue + '/' + target.length + ' ('
						// 紀錄整體進度
						+ (100 * work_continue / target.length | 0) + '%)';
					} else {
						count_summary += target.length;
					}

					count_summary = ': '
							+ gettext('%1 pages done', count_summary);

					if (log_item.report) {
						messages.unshift(count_summary + (nochange_count > 0
						//
						? gettext(', %1%2 pages no change',
						//
						done === nochange_count
						// 未改變任何條目。
						? gettext('all ')
						//
						: '', nochange_count) : '')
						// 使用時間, 歷時, 費時, elapsed time
						+ gettext(', %1 elapsed.',
						//
						messages.start.age(new Date)));
					}
					if (this.stopped) {
						messages
								.add(gettext("'''Stopped''', give up editing."));
					}
					if (done === nochange_count && !config.no_edit) {
						messages.add(gettext('Nothing change.'));
					}
					if (log_item.title && config.summary) {
						// unescape
						messages.unshift(
						// 避免 log page 添加 Category。
						// 在編輯摘要中加上使用者連結，似乎還不至於驚擾到使用者。因此還不用特別處理。
						config.summary.replace(/</g, '&lt;').replace(
						// @see PATTERN_category @ CeL.wiki
						/\[\[\s*(Category|分類|分类|カテゴリ)\s*:/ig, '[[:$1:'));
					}
				}

				// run after every batch task. 在處理每個批次後執行此function。
				if (typeof config.after === 'function') {
					// 對於量過大而被分割者，每次分段結束都將執行一次 config.after()。
					// 注意: 與 wiki_API.prototype.work(config)
					// 之 config.before/config.after 連動。
					//
					// 2016/6/22 change API 應用程式介面變更:
					// .last(messages, titles, pages) → .after(messages, pages,
					// titles)
					// 按照需求程度編排 arguments，並改變適合之函數名。
					config.after.call(this, messages, pages, titles);
				}

				var log_to = 'log_to' in config ? config.log_to
				// default log_to
				: 'User:' + this.token.lgname + '/log/'
						+ (new Date).format('%4Y%2m%2d'),
				// options for summary.
				options = {
					// new section. append 章節/段落 after all, at bottom.
					section : 'new',
					// 新章節的標題。
					sectiontitle : '['
							+ (new Date).format(config.date_format
									|| this.date_format) + ']' + count_summary,
					// Robot: 若用戶名包含 'bot'，則直接引用之。
					// 注意: this.token.lgname 可能為 undefined！
					summary : (PATTERN_BOT_NAME.test(this.token.lgname)
					//
					? this.token.lgname : 'Robot') + ': '
					//
					+ config.summary + count_summary,
					// Throw an error if the page doesn't exist.
					// 若頁面不存在/已刪除，則產生錯誤。
					nocreate : 1,
					// 標記此編輯為機器人編輯。
					bot : 1,
					// 就算設定停止編輯作業，仍強制編輯。一般僅針對測試頁面或自己的頁面，例如寫入 log。
					skip_stopped : true
				};

				if (no_message) {
					;
				} else if (log_to && (done !== nochange_count
				// 若全無變更，則預設僅從 console 提示，不寫入 log 頁面。因此無變更者將不顯示。
				|| config.log_nochange)) {
					this.page(log_to)
					// 將 robot 運作記錄、log summary 報告結果寫入 log 頁面。
					// TODO: 以表格呈現。
					.edit(messages.join('\n'), options,
					// wiki_API.work() 添加網頁報告。
					function(title, error, result) {
						if (error) {
							library_namespace.warn(
							//
							'wiki_API.work: Can not write log to [' + log_to
							//
							+ ']! Try to write to [' + 'User:'
							//
							+ this.token.lgname + ']');
							library_namespace.log(
							//
							'\nlog:<br />\n' + messages.join('<br />\n'));
							// 改寫於可寫入處。e.g., 'Wikipedia:Sandbox'
							// TODO: bug: 當分批時，只會寫入最後一次。
							this.page('User:' + this.token.lgname)
							//
							.edit(messages.join('\n'), options);
						}
					});
				} else {
					library_namespace.log('\nlog:<br />\n'
							+ messages.join('<br />\n'));
				}

				if (setup_target && work_continue < target.length) {
					// 繼續下一批。
					setup_target();
					return;
				}

				// run this at last.
				// 在wiki_API.prototype.work()工作最後執行此config.last()。
				// config.callback()
				// 只有在成功時，才會繼續執行。
				//
				// 2016/6/22 change API 應用程式介面變更:
				// .after() → .last()
				// 改變適合之函數名。
				if (typeof config.last === 'function') {
					this.run(config.last.bind(options));
				}

				this.run(function() {
					library_namespace.log('wiki_API.work: 結束 .work() 作業'
					// 已完成作業
					+ (config.summary ? ' [' + config.summary + ']' : '。'));
				});
			}

		}).bind(this);

		var target = pages || titles,
		// 首先取得多個頁面內容所用之 options。
		// e.g., page_options:{rvprop:'ids|content|timestamp'}
		// @see
		// https://www.mediawiki.org/w/api.php?action=help&modules=query%2Brevisions
		page_options = Object.assign({
			is_id : config.is_id,
			multi : true
		}, config.page_options),
		// 處理數目限制 limit。單一頁面才能取得多 revisions。多頁面(≤50)只能取得單一 revision。
		// https://www.mediawiki.org/w/api.php?action=help&modules=query
		// titles/pageids: Maximum number of values is 50 (500 for bots).
		slice_size = config.slice >= 1 ? Math.min(config.slice | 0, 500) : 500,
		/** {ℕ⁰:Natural+0}自此 index 開始繼續作業 */
		work_continue = 0, this_slice_size, setup_target;

		// 個別頁面會採用的 page options 選項。
		var single_page_options = Object.assign({
			// 已經在多個頁面的時候取得過內容，因此不需要再確認一次。只是要過個水設定一下。
			// 若是沒有設定這個選項，那麼對於錯誤的頁面，將會再嘗試取得。
			allow_missing : true,
		}, config.page_options);
		// 在個別頁面還採取 .multi 這個選項會造成錯誤。
		delete single_page_options.multi;

		if (!config.no_edit) {
			var check_options = config.check_options;
			if (!check_options && typeof config.log_to === 'string'
			// 若 log_to 以數字作結，自動將其當作 section。
			&& (check_options = config.log_to.match(/\d+$/))) {
				check_options = {
					section : check_options[0]
				};
			}

			if (check_options) {
				// wiki_API.check_stop()
				this.check(check_options);
			}
		}

		if (Array.isArray(target)) {
			// Split when length is too long. 分割過長的 list。
			setup_target = (function() {
				var this_slice = target.slice(work_continue, work_continue
						+ slice_size),
				// 自動判別最大可用 index，預防 "414 Request-URI Too Long"。
				// 因為 8000/500-3 = 13 > 最長 page id，因此即使 500頁也不會超過。
				// 為提高效率，不作 check。
				max_size = config.is_id ? 500 : check_max_length(this_slice,
						500);
				// console.log([ 'max_size:', max_size, config.is_id ]);
				if (max_size < slice_size) {
					this_slice = this_slice.slice(0, max_size);
				}
				if (work_continue === 0 && max_size === target.length) {
					library_namespace.debug('設定一次先取得所有 ' + target.length
							+ ' 個頁面之 revisions (page contents 頁面內容)。', 2,
							'wiki_API.work');
				} else {
					nochange_count = target.length;
					done = '處理分塊 ' + (work_continue + 1) + '–' + (work_continue
					// start–end/all
					+ Math.min(max_size, nochange_count)) + '/'
							+ nochange_count;
					// Add percentage.
					if (nochange_count > 1e4)
						done += ' ('
								+ (100 * work_continue / nochange_count | 0)
								+ '%)';
					// done += '。';
					nochange_count = 'wiki_API.work: ';
					done = config.summary ? [ nochange_count, 'fg=green',
							config.summary, '-fg', ': ' + done ]
							: [ nochange_count + done ];
					library_namespace.sinfo(done);
				}

				// reset count and log.
				done = nochange_count = 0;
				messages.reset();

				this_slice_size = this_slice.length;
				work_continue += this_slice_size;
				// console.log([ 'page_options:', page_options ]);
				this.page(this_slice, main_work, page_options);
			}).bind(this);
			setup_target();

		} else {
			// assert: target is {String}title or {Object}page_data
			library_namespace.debug('取得單一頁面之 (page contents 頁面內容)。', 2,
					'wiki_API.work');
			this_slice_size = target.length;
			this.page(target, main_work, page_options);
		}
	};

	/**
	 * 選擇要紀錄的項目。在大量編輯時，可利用此縮減 log。
	 * 
	 * @type {Object}
	 */
	wiki_API.prototype.work.log_item = {
		title : true,
		report : true,
		get_pages : true,
		// 跳過[[WP:NULLEDIT|無改變]]的。
		// nochange : false,
		error : true,
		succeed : true
	};

	// ------------------------------------------------------------------------

	// 不用 copy_to 的原因是 copy_to(wiki) 得遠端操作 wiki，不能保證同步性。
	// this_wiki.copy_from(wiki) 則呼叫時多半已經設定好 wiki，直接在本this_wiki中操作比較不會有同步性問題。
	// 因為直接採wiki_API.prototype.copy_from()會造成.page().copy_from()時.page()尚未執行完，
	// 這會使執行.copy_from()時尚未取得.last_page，因此只好另開function。
	// @see [[Template:Copied]], [[Special:Log/import]]
	// TODO: 添加 wikidata sitelinks 語言連結。處理分類。處理模板。
	var wiki_API_prototype_copy_from = function(title, options, callback) {
		if (typeof options === 'function') {
			// shift arguments
			callback = options;
			options = undefined;
		}

		options = Object.assign({
			// [KEY_SESSION]
			session : this
		}, options);

		var _this = this, copy_from_wiki;
		function edit() {
			// assert: get_page_content.is_page_data(title)
			var content_to_copy = get_page_content(title);
			if (typeof options.processor === 'function') {
				// options.processor(from content_to_copy, to content)
				content_to_copy = options.processor(title,
						get_page_content(_this.last_page));
			}
			if (!content_to_copy) {
				library_namespace
						.warn('wiki_API_prototype_copy_from: Nothing to copy!');
				_this.next();
			}

			var content;
			if (options.append && (content
			//
			= get_page_content(_this.last_page).trimEnd())) {
				content_to_copy = content + '\n' + content_to_copy;
				options.summary = 'Append from '
						+ get_page_title_link(title, copy_from_wiki) + '.';
			}
			if (!options.summary) {
				options.summary = 'Copy from '
				// TODO: 複製到非維基項目外的私人維基，例如moegirl時，可能需要用到[[zhwiki:]]這樣的prefix。
				+ get_page_title_link(title, copy_from_wiki) + '.';
			}
			_this.actions.unshift(
			// wiki.edit(page, options, callback)
			[ 'edit', content_to_copy, options, callback ]);
			_this.next();
		}

		if (is_wiki_API(title)) {
			// from page 為另一 wiki_API
			copy_from_wiki = title;
			// wiki.page('title').copy_from(wiki)
			title = copy_from_wiki.last_page;
			if (!title) {
				// wiki.page('title').copy_from(wiki);
				library_namespace.debug('先擷取同名title: '
						+ get_page_title_link(this.last_page, copy_from_wiki));
				// TODO: create interwiki link
				copy_from_wiki.page(get_page_title(this.last_page), function(
						page_data) {
					library_namespace.debug('Continue coping page');
					// console.log(copy_from_wiki.last_page);
					wiki_API_prototype_copy_from.call(_this, copy_from_wiki,
							options, callback);
				});
				return;
			}
		}

		if (get_page_content.is_page_data(title)) {
			// wiki.page().copy_from(page_data)
			edit();

		} else {
			// treat title as {String}page title in this wiki
			// wiki.page().copy_from(title)
			var to_page_data = this.last_page;
			// 即時性，不用 async。
			// wiki_API.page(title, callback, options)
			wiki_API.page(title, function(from_page_data) {
				// recover this.last_page
				_this.last_page = to_page_data;
				title = from_page_data;
				edit();
			}, options);
		}

		return this;
	};

	// --------------------------------------------------------------------------------------------
	// 以下皆泛用，無須 wiki_API instance。

	/**
	 * 實際執行 query 操作，直接 call API 之核心函數。
	 * 
	 * 所有會利用到 wiki_API.prototype.work ← wiki_API.prototype.next ← <br />
	 * wiki_API.page, wiki_API.edit, ... ← wiki_API.query ← get_URL ← <br />
	 * need standalone http agent 的功能，都需要添附 session 參數。
	 * 
	 * @param {String|Array}action
	 *            {String}action or [ {String}api URL, {String}action,
	 *            {Object}other parameters ]
	 * @param {Function}callback
	 *            回調函數。 callback(response data, error)
	 * @param {Object}[post_data]
	 *            data when need using POST method
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項<br />
	 *            wiki_API.edit 可能輸入 session 當作 options。
	 * 
	 * @see api source:
	 *      https://phabricator.wikimedia.org/diffusion/MW/browse/master/includes/api
	 */
	wiki_API.query = function(action, callback, post_data, options) {
		// 處理 action
		library_namespace.debug('action: ' + action, 2, 'wiki_API.query');
		if (typeof action === 'string')
			action = [ , action ];
		else if (!Array.isArray(action))
			library_namespace.error('wiki_API.query: Invalid action: ['
					+ action + ']');
		library_namespace.debug('api URL: (' + (typeof action[0]) + ') ['
				+ action[0] + '] → [' + api_URL(action[0]) + ']', 3,
				'wiki_API.query');
		action[0] = api_URL(action[0]);

		// https://www.mediawiki.org/w/api.php?action=help&modules=query
		if (!/^[a-z]+=/.test(action[1]))
			action[1] = 'action=' + action[1];
		var method = action[1].match(/(?:^|&)action=([a-z]+)/);
		method = method && method[1];

		// respect maxlag. 若為 query，非 edit (modify)，則不延遲等待。
		var need_check_lag
		// method 2: edit 時皆必須設定 token。
		= post_data && post_data.token,
		// 檢測是否間隔過短。支援最大延遲功能。
		to_wait,
		// interval.
		lag_interval = options && options.lag >= 0 ? options.lag :
		// ↑ wiki_API.edit 可能輸入 session 當作 options。
		// options[KEY_SESSION] && options[KEY_SESSION].lag ||
		wiki_API.query.default_lag;

		if (false) {
			// method 1:
			// assert: typeof action[1] === 'string'
			need_check_lag = action[1]
					.match(/(?:action|assert)=([a-z]+)(?:&|$)/);
			if (!need_check_lag) {
				library_namespace.warn('wiki_API.query: Unknown action: '
						+ action[1]);
			} else if (need_check_lag = /edit|create/i.test(need_check_lag[1])) {
				to_wait = lag_interval
						- (Date.now() - wiki_API.query.last[action[0]]);
			}
		}
		if (need_check_lag) {
			to_wait = lag_interval
					- (Date.now() - wiki_API.query.last[action[0]]);
		}

		// TODO: 伺服器負載過重的時候，使用 exponential backoff 進行延遲。
		if (to_wait > 0) {
			library_namespace.debug('Waiting ' + to_wait + ' ms..', 2,
					'wiki_API.query');
			setTimeout(function() {
				wiki_API.query(action, callback, post_data, options);
			}, to_wait);
			return;
		}
		if (need_check_lag) {
			// reset timer
			wiki_API.query.last[action[0]] = Date.now();
		} else {
			library_namespace.debug('非 edit (modify)，不延遲等待。', 3,
					'wiki_API.query');
		}

		// additional parameters
		if (!action[2] && options && options.additional) {
			action[2] = options.additional;
		}

		// https://www.mediawiki.org/wiki/API:Data_formats
		// 因不在 white-list 中，無法使用 CORS。
		action[0] += '?' + action[1];
		// [ {String}api URL, {String}action, {Object}other parameters ]
		// →
		// [ {String}URL, {Object}other parameters ]
		action = library_namespace.is_Object(action[2]) ? [ action[0],
				action[2] ] : [
		// assert: action[2] && {String}action[2]
		action[2] ? action[0] + (action[2].startsWith('&') ? '' : '&')
		//
		+ action[2] : action[0], Object.create(null) ];
		if (!action[1].format) {
			// 加上 "&utf8", "&utf8=1" 可能會導致把某些 link 中 URL 編碼也給 unescape 的情況！
			action[0] = get_URL.add_parameter(action[0], 'format=json&utf8');
		}

		// 一般情況下會重新導向至 https。
		// 若在 Wikimedia Toolforge 中，則視為在同一機房內，不採加密。如此亦可加快傳輸速度。
		if (wmflabs && wiki_API.use_Varnish) {
			// UA → nginx → Varnish:80 → Varnish:3128 → Apache → HHVM → database
			// https://wikitech.wikimedia.org/wiki/LVS_and_Varnish
			library_namespace.debug('connect to Varnish:3128 directly.', 3,
					'wiki_API.query');
			// [[User:Antigng/https expected]]
			var HOST;
			action[0] = action[0].replace(
			// @see PATTERN_PROJECT_CODE
			/^https?:\/\/([a-z][a-z\d\-]{0,14}\.wikipedia\.org)\//,
			//
			function(all, host) {
				HOST = host;
				// Warning: 這方式已被 blocked。
				// @see https://phabricator.wikimedia.org/T137707
				return 'http://cp1008.wikimedia.org:3128/';
			});
			if (HOST) {
				action = {
					URL : action,
					headers : {
						HOST : HOST,
						'X-Forwarded-For' : '127.0.0.1',
						'X-Forwarded-Proto' : 'https'
					}
				};
			}
		}

		/**
		 * TODO: 簡易的泛用先期處理程式。
		 * 
		 * @inner
		 */
		function response_handler(response) {
			if (library_namespace.is_debug(3)
			// .show_value() @ interact.DOM, application.debug
			&& library_namespace.show_value)
				library_namespace.show_value(data, 'wiki_API.query: data');

			var error = data && data.error;
			// 檢查伺服器回應是否有錯誤資訊。
			if (error) {
				library_namespace.error('wiki_API.query: ['
				//
				+ error.code + '] ' + error.info);
			}

			if (typeof callback === 'function') {
				callback(response);
			}
		}

		// 開始處理 query request。
		if (!post_data && wiki_API.query.allow_JSONP) {
			library_namespace.debug(
					'採用 JSONP callback 的方法。須注意：若有 error，將不會執行 callback！', 2,
					'wiki_API.query');
			library_namespace.debug('callback : (' + (typeof callback) + ') ['
					+ callback + ']', 3, 'wiki_API.query');
			get_URL(action, {
				callback : callback
			});

		} else {
			// console.log('-'.repeat(79));
			// console.log(options);
			var get_URL_options = options && options.get_URL_options;
			// @see function setup_API_URL(session, API_URL)
			if (!get_URL_options) {
				var session = options && (options[KEY_SESSION]
				// 檢查若 options 本身即為 session。
				|| is_wiki_API(options) && options);
				if (session) {
					if (method === 'edit' && post_data
					//
					&& (!post_data.token || post_data.token === BLANK_TOKEN)
					// 防止未登錄編輯
					&& session.token
					//
					&& (session.token.lgpassword || session.preserve_password)) {
						// console.log([ action, post_data ]);
						library_namespace.error('wiki_API.query: 未登錄編輯？');
						throw new Error('未登錄編輯？');
					}

					// assert: get_URL_options 為 session。
					if (!session.get_URL_options) {
						library_namespace.debug(
								'為 wiki_API instance，但無 agent，需要造出 agent。', 2,
								'wiki_API.query');
						setup_API_URL(session, true);
					}
					get_URL_options = session.get_URL_options;
				}
			}
			if (options && options.form_data) {
				// @see wiki_API.upload()
				library_namespace.debug('Set form_data', 6);
				// throw 'Set form_data';
				// options.form_data 會被當作傳入 to_form_data() 之 options。
				get_URL_options.form_data = options.form_data;
			}

			if (false) {
				// test options.get_URL_options
				if (get_URL_options) {
					if (false)
						console.log('wiki_API.query: Using get_URL_options: '
								+ get_URL_options.agent);
					// console.log(options);
					// console.log(action);
				} else {
					// console.trace('wiki_API.query: Without get_URL_options');
					// console.log(action);
					throw 'wiki_API.query: Without get_URL_options';
				}
			}

			if (false && typeof callback === 'function'
			// use options.get_URL_options:{onfail:function(error){}} instead.
			&& (!get_URL_options || !get_URL_options.onfail)) {
				get_URL_options = Object.assign({
					onfail : function(error) {
						if (false) {
							if (error.code === 'ENOTFOUND'
							// CeL.wiki.wmflabs
							&& wmflabs) {
								// 若在 Wikimedia Toolforge 取得 wikipedia 的資料，
								// 卻遇上 domain name not found，
								// 通常表示 language (API_URL) 設定錯誤。
							}

							/**
							 * do next action. 警告: 若是自行設定 .onfail，則需要自行善後。
							 * 例如可能得在最後自行執行(手動呼叫) wiki.next()， 使
							 * wiki_API.prototype.next() 知道應當重新啟動以處理 queue。
							 */
							wiki.next();

							var session = options && (options[KEY_SESSION]
							// 檢查若 options 本身即為 session。
							|| is_wiki_API(options) && options);
							if (session) {
								session.running = false;
							}
						}
						typeof callback === 'function'
								&& callback(undefined, error);
					}
				}, get_URL_options);
			}

			var agent = get_URL_options && get_URL_options.agent;
			if (agent && agent.last_cookie && (agent.last_cookie.length > 80
			// cache cache: 若是用同一個 agent 來 access 過多 Wikipedia 網站，
			// 可能因 wikiSession 過多(如.length === 86)而造成 413 (請求實體太大)。
			|| agent.cookie_cache)) {
				if (agent.last_cookie.length > 80) {
					library_namespace.debug('重整 cookie['
							+ agent.last_cookie.length + ']。', 1,
							'wiki_API.query');
					if (!agent.cookie_cache)
						agent.cookie_cache
						// {zh:['','',...],en:['','',...]}
						= Object.create(null);
					var last_cookie = agent.last_cookie;
					agent.last_cookie = [];
					while (last_cookie.length > 0) {
						var cookie_item = last_cookie.pop();
						if (!cookie_item) {
							// 不知為何，也可能出現這種 cookie_item === undefined 的情況。
							continue;
						}
						var matched = cookie_item
								.match(/^([a-z_\d]{2,20})wiki/);
						if (matched) {
							var language = matched[1];
							if (language in agent.cookie_cache)
								agent.cookie_cache[language].push(cookie_item);
							else
								agent.cookie_cache[language] = [ cookie_item ];
						} else {
							agent.last_cookie.push(cookie_item);
						}
					}
					library_namespace.debug('重整 cookie: → ['
							+ agent.last_cookie.length + ']。', 1,
							'wiki_API.query');
				}

				var language = session && session.language;
				if (!language) {
					library_namespace.debug(
							'未設定 session，自 API_URL 擷取 language: [' + action[0]
									+ ']。', 1, 'wiki_API.query');
					language = typeof action[0] === 'string'
					// TODO: 似乎不能真的擷取到所需 language。
					&& action[0].match(PATTERN_wiki_project_URL);
					language = language && language[3] || default_language;
					// e.g., wiki_API.query: Get "ja" from
					// ["https://ja.wikipedia.org/w/api.php?action=edit&format=json&utf8",{}]
					library_namespace.debug('Get "' + language + '" from '
							+ JSON.stringify(action), 1, 'wiki_API.query');
				}
				language = language.replace(/-/g, '_');
				if (language in agent.cookie_cache) {
					agent.last_cookie.append(agent.cookie_cache[language]);
					delete agent.cookie_cache[language];
				}
			}

			get_URL(action, function(XMLHttp, error) {
				var status_code, response;
				if (error) {
					// assert: !!XMLHttp === false
					status_code = error;
				} else {
					status_code = XMLHttp.status;
					response = XMLHttp.responseText;
				}

				if (error || /^[45]/.test(status_code)) {
					// e.g., 503, 413
					if (get_URL_options
							&& typeof get_URL_options.onfail === 'function') {
						get_URL_options.onfail(status_code);
					} else if (typeof callback === 'function') {
						library_namespace.warn(
						//
						'wiki_API.query: Get error ' + status_code + ': '
						// 避免 TypeError:
						// Cannot convert object to primitive value
						+ JSON.stringify(action));
						callback(response, status_code);
					}
					return;
				}

				// response = XMLHttp.responseXML;
				library_namespace.debug('response ('
						+ response.length
						+ ' characters): '
						+ (library_namespace.platform.nodejs ? '\n' + response
								: response.replace(/</g, '&lt;')), 3,
						'wiki_API.query');

				// "<\": for Eclipse JSDoc.
				if (/<\html[\s>]/.test(response.slice(0, 40))) {
					response = response.between('source-javascript', '</pre>')
							.between('>')
							// 去掉所有 HTML tag。
							.replace(/<[^>]+>/g, '');

					// '&#123;' : (")
					// 可能會導致把某些 link 中 URL 編碼也給 unescape 的情況?
					if (response.includes('&#'))
						response = library_namespace.HTML_to_Unicode(response);
				}

				// library_namespace.log(response);
				// library_namespace.log(library_namespace.HTML_to_Unicode(response));
				if (response) {
					try {
						response = library_namespace.parse_JSON(response);
					} catch (e) {
						// <title>414 Request-URI Too Long</title>
						// <title>414 Request-URI Too Large</title>
						if (response.includes('>414 Request-URI Too ')) {
							library_namespace.debug(
							//
							action[0], 1, 'wiki_API.query');
						} else {
							// TODO: 處理 API 傳回結尾亂編碼的情況。
							// https://phabricator.wikimedia.org/T134094
							// 不一定總是有效。

							library_namespace.error(
							//
							'wiki_API.query: Invalid content: ['
									+ String(response).slice(0, 40000) + ']');
							library_namespace.error(e);
						}

						// error handling
						if (get_URL_options.onfail) {
							get_URL_options.onfail(e);
						} else if (typeof callback === 'function') {
							callback(response, e);
						}

						// exit!
						return;
					}
				}

				if (typeof callback === 'function') {
					callback(response);
				} else {
					library_namespace
							.error('wiki_API.query: No {Function}callback!');
				}

			}, null, post_data, get_URL_options);
		}
	};

	/**
	 * edit (modify) 時之最大延遲參數。<br />
	 * default: 使用5秒 (5000 ms) 的最大延遲參數。
	 * 
	 * 在 Wikimedia Toolforge 上 edit wikidata，單線程均速最快約 1584 ms/edits。
	 * 
	 * @type {Object} of {ℕ⁰:Natural+0}
	 * 
	 * @see https://www.mediawiki.org/wiki/Manual:Maxlag_parameter
	 *      https://www.mediawiki.org/wiki/API:Etiquette 禮儀
	 *      https://phabricator.wikimedia.org/T135240
	 */
	wiki_API.query.default_lag = 5000;

	// local rule
	wiki_API.query.lag = {
		// [[:ja:WP:bot]]
		// Botの速度は、おおよそ毎分 6 編集を限度としてください。
		// e.g., @ User contributions,
		// Due to high database server lag, changes newer than 30 seconds may
		// not be shown in this list.
		// 由於資料庫回應延遲，此清單可能不會顯示最近 30 秒內的變更。
		// Changes newer than 25 seconds may not be shown in this list.
		// 此清單可能不會顯示最近 25 秒內的變更。
		ja : 10000
	};

	/**
	 * 對於可以不用 XMLHttp 的，直接採 JSONP callback 法。
	 * 
	 * @type {Boolean}
	 */
	wiki_API.query.allow_JSONP = library_namespace.is_WWW(true) && false;

	/**
	 * URL last queried.<br />
	 * wiki_API.query.last[URL] = {Date}last queried date
	 * 
	 * @type {Object}
	 */
	wiki_API.query.last = Object.create(null);

	/**
	 * 取得 page_data 之 title parameter。<br />
	 * e.g., {pageid:8,title:'abc'} → 'pageid=8'<br />
	 * e.g., {title:'abc'} → 'title=abc'<br />
	 * e.g., 'abc' → 'title=abc'<br />
	 * 
	 * @param {Object}page_data
	 *            page data got from wiki API.
	 * @param {Boolean}[multi]
	 *            page_data is {Array}multi-page_data
	 * @param {Boolean}[is_id]
	 *            page_data is page_id instead of page_data
	 * @param {String}[param_name]
	 *            param name. default: 'title' or 'titles'.
	 */
	wiki_API.query.title_param = function(page_data, multi, is_id, param_name) {
		var pageid;

		if (Array.isArray(page_data)) {
			// auto detect multi
			if (multi === undefined) {
				multi = pageid.length > 1;
			}

			pageid = [];
			// 確認所有 page_data 皆有 pageid 屬性。
			if (page_data.every(function(page) {
				// {ℕ⁰:Natural+0}page.pageid
				if (page = page && page.pageid)
					pageid.push(page);
				return page;
			})) {
				pageid = pageid.join('|');

			} else {
				if (library_namespace.is_Object(page_data)) {
					library_namespace
							.warn('wiki_API.query.title_param: 看似有些非正規之頁面資料。');
					library_namespace
							.info('wiki_API.query.title_param: 將採用 title 為主要查詢方法。');
				}
				// reset
				pageid = page_data
						.map(function(page) {
							// {String}title or {title:'title'}
							return (typeof page === 'object' ? page.title
									: page)
									|| '';
						});
				if (is_id) {
					pageid = pageid.join('|');
				} else {
					page_data = pageid.join('|');
					pageid = undefined;
				}
				library_namespace.debug(pageid || page_data, 2,
						'wiki_API.query.title_param');
			}

		} else if (library_namespace.is_Object(page_data)) {
			if (page_data.pageid > 0)
				// 有正規之 pageid 則使用之，以加速 search。
				pageid = page_data.pageid;
			else
				page_data = page_data.title;

		} else if (is_id !== false && typeof page_data === 'number'
		// {ℕ⁰:Natural+0}pageid should > 0.
		// pageid 0 回傳格式不同於 > 0 時。
		// https://www.mediawiki.org/w/api.php?action=query&prop=revisions&pageids=0
		&& page_data > 0 && page_data === (page_data | 0)) {
			pageid = page_data;

		} else if (!page_data) {
			library_namespace
					.error('wiki_API.query.title_param: Invalid title: ['
							+ page_data + ']');
			// console.warn(page_data);
		}

		multi = multi ? 's=' : '=';

		return pageid === undefined
		//
		? (param_name || 'title' + multi) + encodeURIComponent(page_data)
		//
		: 'pageid' + multi + pageid;
	};

	/**
	 * get id of page
	 * 
	 * @param {Object}page_data
	 *            page data got from wiki API.
	 * @param {Boolean}[title_only]
	 *            get title only
	 * 
	 * @see get_page_title
	 */
	wiki_API.query.id_of_page = function(page_data, title_only) {
		if (Array.isArray(page_data))
			return page_data.map(function(page) {
				wiki_API.query.id_of_page(page, title_only);
			});
		if (library_namespace.is_Object(page_data))
			// 有 pageid 則使用之，以加速。
			return !title_only && page_data.pageid || page_data.title;

		if (!page_data)
			library_namespace
					.error('wiki_API.query.id_of_page: Invalid title: ['
							+ page_data + ']');
		return page_data;
	};

	// ------------------------------------------------------------------------

	if (false) {
		wiki.page('巴黎協議 (消歧義)', {
			query_props : 'pageprops'
		});
		// wiki.last_page

		// for "Date of page creation" 頁面建立日期 @ Edit history 編輯歷史 @ 頁面資訊
		// &action=info
		wiki.page('巴黎協議', function(page_data) {
			// e.g., '2015-12-17T12:10:18.000Z'
			console.log(CeL.wiki.content_of.edit_time(page_data));
		}, {
			rvdir : 'newer',
			rvprop : 'timestamp',
			rvlimit : 1
		});

		wiki.page('巴黎協議', function(page_data) {
			// {Date}page_data.creation_Date
			console.log(page_data);
		}, {
			get_creation_Date : true
		});
	}

	// assert: !!KEY_KEEP_INDEX === true
	var KEY_KEEP_INDEX = 'keep index',
	// assert: !!KEY_KEEP_ORDER === true
	KEY_KEEP_ORDER = 'keep order';

	/**
	 * 讀取頁面內容，取得頁面源碼。可一次處理多個標題。
	 * 
	 * 注意: 用太多 CeL.wiki.page() 並列處理，會造成 error.code "EMFILE"。
	 * 
	 * TODO:
	 * https://www.mediawiki.org/w/api.php?action=help&modules=expandtemplates
	 * or https://www.mediawiki.org/w/api.php?action=help&modules=parse
	 * 
	 * @example <code>

	CeL.wiki.page('史記', function(page_data) {
		CeL.show_value(page_data);
	});

	// for many pages, e.g., more than 200, please use:
	wiki.work({
		// redirects : 1,
		each : for_each_page_data,
		last : last_operation,
		no_edit : true,
		page_options : {
			// multi : 'keep index',
			// converttitles : 1,
			redirects : 1
		}
	}, page_list);

	 </code>
	 * 
	 * @param {String|Array}title
	 *            title or [ {String}API_URL, {String}title or {Object}page_data ]
	 * @param {Function}[callback]
	 *            回調函數。 callback(page_data, error) { page_data.title; var
	 *            content = CeL.wiki.content_of(page_data); }
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * 
	 * @see https://www.mediawiki.org/w/api.php?action=help&modules=query%2Brevisions
	 */
	wiki_API.page = function(title, callback, options) {
		if (typeof callback === 'object' && options === undefined) {
			// shift arguments
			options = callback;
			callback = undefined;
		}

		// 正規化並提供可隨意改變的同內容參數，以避免修改或覆蓋附加參數。
		options = library_namespace.new_options(options);

		// console.log('title: ' + JSON.stringify(title));
		if (options.get_creation_Date) {
			// 警告:僅適用於單一頁面。
			wiki_API.page(title, function(page_data, error) {
				if (error || !page_data || ('missing' in page_data)) {
					// error? 此頁面不存在/已刪除。
					callback(page_data, error);
					return;
				}

				// e.g., '2015-12-17T12:10:18.000Z'
				// page_data.revisions[0].timestamp;

				page_data.creation_Date
				// CeL.wiki.content_of.edit_time(page_data)
				= get_page_content.edit_time(page_data);
				if (typeof options.get_creation_Date === 'function') {
					options.get_creation_Date(page_data.creation_Date,
							page_data);
				}
				if (false) {
					console.log(page_data.creation_Date.format('%Y/%m/%d'));
				}

				delete options.get_creation_Date;
				// 去掉僅有timestamp，由舊至新的.revisions。
				delete page_data.revisions;
				// 若有需要順便取得頁面內容，需要手動設定如:
				// {get_creation_Date:true,prop:'revisions'}
				if (options.query_props || options.prop) {
					wiki_API.page(title, callback, options);
				} else {
					callback(page_data);
				}

			}, {
				rvdir : 'newer',
				rvprop : 'timestamp',
				rvlimit : 1
			});
			return;
		}

		if (options.query_props) {
			var query_props = options.query_props, page_data,
			//
			get_properties = function(page) {
				if (page) {
					if (page_data)
						Object.assign(page_data, page);
					else
						page_data = page;
				}
				var prop;
				while (query_props.length > 0
				//
				&& !(prop = query_props.shift()))
					;

				if (!prop || page_data && ('missing' in page_data)) {
					// 此頁面不存在/已刪除。
					callback(page_data);
				} else {
					library_namespace.debug('Get property: [' + prop + ']', 1,
							'wiki_API.page');
					options.prop = prop;
					wiki_API.page(title, get_properties, options);
				}
			};

			delete options.query_props;
			if (typeof query_props === 'string') {
				query_props = query_props.split('|');
			}
			if (Array.isArray(query_props)) {
				if (!options.no_content)
					query_props.push('revisions');
				get_properties();
			} else {
				library_namespace.error('wiki_API.page: Invalid .query_props!');
				throw 'wiki_API.page: Invalid .query_props';
			}
			return;
		}

		var action = normalize_title_parameter(title, options);
		if (!action) {
			library_namespace.error('wiki_API.page: Invalid title: '
					+ JSON.stringify(title));
			callback(undefined, 'Invalid title: ' + get_page_title_link(title));
			return;
			throw 'wiki_API.page: Invalid title: ' + get_page_title_link(title);
		}

		var get_content;
		if ('prop' in options) {
			get_content = options.prop &&
			// {String|Array}
			options.prop.includes('revisions');
		} else {
			options.prop = 'revisions';
			get_content = true;
		}

		if (get_content) {
			// 處理數目限制 limit。單一頁面才能取得多 revisions。多頁面(≤50)只能取得單一 revision。
			// https://www.mediawiki.org/w/api.php?action=help&modules=query
			// titles/pageids: Maximum number of values is 50 (500 for bots).
			if ('rvlimit' in options) {
				if (options.rvlimit > 0 || options.rvlimit === 'max')
					action[1] += '&rvlimit=' + options.rvlimit;
			} else if (!action[1].includes('|')
			//
			&& !action[1].includes(encodeURIComponent('|')))
				// default: 僅取得單一 revision。
				action[1] += '&rvlimit=1';

			// Which properties to get for each revision
			get_content = (Array.isArray(options.rvprop)
			//
			&& options.rvprop.join('|') || options.rvprop)
			//
			|| wiki_API.page.rvprop;

			action[1] = 'rvprop='
			//
			+ get_content + '&' + action[1];

			get_content = get_content.includes('content');
		}

		if (options.rvdir) {
			// e.g., rvdir=newer
			// Get first revisions
			action[1] = 'rvdir=' + options.rvdir + '&' + action[1];
		}

		// 自動搜尋/轉換繁簡標題。
		if (!('converttitles' in options)) {
			options.converttitles = wikidata_get_site(options, true)
					|| default_language;
			if (!wiki_API.page.auto_converttitles
					.includes(options.converttitles)) {
				delete options.converttitles;
			}
		}
		if (options.converttitles) {
			action[1] = 'converttitles=' + options.converttitles + '&'
					+ action[1];
		}

		// Which properties to get for the queried pages
		// 輸入 prop:'' 或再加上 redirects:1 可以僅僅確認頁面是否存在，以及頁面的正規標題。
		if (options.prop) {
			if (Array.isArray(options.prop)) {
				options.prop = options.prop.join('|');
			}

			// e.g., prop=info|revisions
			// e.g., prop=pageprops|revisions
			// 沒 .pageprops 的似乎大多是沒有 Wikidata entity 的？
			action[1] = 'prop=' + options.prop + '&' + action[1];
		}

		add_parameters(action, options);

		action[1] = 'query&' + action[1];

		if (!action[0]) {
			action = action[1];
		}

		library_namespace.debug('get url token: ' + action, 5, 'wiki_API.page');

		wiki_API.query(action, typeof callback === 'function'
		//
		&& function(data) {
			if (library_namespace.is_debug(2)
			// .show_value() @ interact.DOM, application.debug
			&& library_namespace.show_value) {
				library_namespace.show_value(data, 'wiki_API.page: data');
			}

			var error = data && data.error;
			// 檢查伺服器回應是否有錯誤資訊。
			if (error) {
				library_namespace.error('wiki_API.page: ['
				//
				+ error.code + '] ' + error.info);
				/**
				 * e.g., Too many values supplied for parameter 'pageids': the
				 * limit is 50
				 */
				if (data.warnings && data.warnings.query
				//
				&& data.warnings.query['*'])
					library_namespace.warn(
					//
					'wiki_API.page: ' + data.warnings.query['*']);
				callback(undefined, error);
				return;
			}

			if (false && data.warnings && data.warnings.result
			/**
			 * e.g., <code>
			 * { continue: { rvcontinue: '2421|39477047', continue: '||' },
			 *   warnings: { result: { '*': 'This result was truncated because it would otherwise  be larger than the limit of 12,582,912 bytes' } },
			 *   query:
			 *    { pages:
			 *       { '13': [Object],
			 *       ...
			 * </code>
			 * limit: 12 MB. 此時應該有 .continue。
			 */
			&& data.warnings.result['*']) {
				if (false && data.warnings.result['*'].includes('truncated'))
					data.truncated = true;
				library_namespace.warn(
				//
				'wiki_API.page: ' + data.warnings.result['*']);
			}

			if (!data || !data.query || !data.query.pages) {
				library_namespace.warn('wiki_API.page: Unknown response: ['
				// e.g., 'wiki_API.page: Unknown response:
				// [{"batchcomplete":""}]'
				+ (typeof data === 'object' && typeof JSON !== 'undefined'
				//
				? JSON.stringify(data) : data) + ']');
				// library_namespace.set_debug(6);
				if (library_namespace.is_debug()
				// .show_value() @ interact.DOM, application.debug
				&& library_namespace.show_value)
					library_namespace.show_value(data);
				callback(undefined, 'Unknown response');
				return;
			}

			var page_list = [],
			//
			page_cache_prefix = library_namespace.platform.nodejs && node_fs
			//
			&& options.page_cache_prefix;

			var continue_id;
			if ('continue' in data) {
				// page_list['continue'] = data['continue'];
				if (data['continue']
				//
				&& typeof data['continue'].rvcontinue === 'string'
				//
				&& (continue_id = data['continue'].rvcontinue
				// assert: page_list['continue'].rvcontinue = 'id|...'。
				.match(/^[1-9]\d*/))) {
					continue_id = Math.floor(continue_id[0]);
				}
				if (false && data.truncated)
					page_list.truncated = true;

			}

			var redirect_from;
			if (data.query.redirects) {
				page_list.redirects = data.query.redirects;
				if (Array.isArray(data.query.redirects)) {
					page_list.redirect_from
					// 記錄經過重導向的標題。
					= redirect_from = Object.create(null);
					data.query.redirects.forEach(function(item) {
						redirect_from[item.to] = item.from;
					});
				}
			}
			var convert_from;
			if (data.query.converted) {
				page_list.converted = data.query.converted;
				if (Array.isArray(data.query.converted)) {
					page_list.convert_from
					// 記錄經過轉換的標題。
					= convert_from = Object.create(null);
					data.query.converted.forEach(function(item) {
						convert_from[item.to] = item.from;
					});
				}
			}

			var pages = data.query.pages;
			// 其他 .prop 本來就不會有內容。
			var need_warn = get_content;

			for ( var pageid in pages) {
				var page_data = pages[pageid];
				if (!get_page_content.has_content(page_data)) {

					if (continue_id && continue_id === page_data.pageid) {
						// 找到了 page_list.continue 所指之 index。
						// effect length
						page_list.OK_length = page_list.length;
						// 當過了 continue_id 之後，表示已經被截斷，則不再警告。
						need_warn = false;
					}

					if (need_warn) {
						library_namespace.warn('wiki_API.page: '
						// 此頁面不存在/已刪除。Page does not exist. Deleted?
						+ ('missing' in page_data
						// e.g., 'wiki_API.page: Not exists: [[title]]'
						? 'Not exists' : 'No contents')
						//
						+ ': ' + (page_data.title
						//
						? get_page_title_link(page_data)
						//
						: 'id ' + page_data.pageid));
					}

				} else if (page_cache_prefix) {
					node_fs.writeFile(page_cache_prefix
					//
					+ page_data.title + '.json',
					/**
					 * 寫入cache。
					 * 
					 * 2016/10/28 21:44:8 Node.js v7.0.0 <code>
					DeprecationWarning: Calling an asynchronous function without callback is deprecated.
					</code>
					 */
					JSON.stringify(pages), wiki_API.encoding, function() {
						library_namespace.debug(
						// 因為此動作一般說來不會影響到後續操作，因此採用同時執行。
						'Write to cache file: done.', 1, 'wiki_API.page');
					});
				}

				if (redirect_from && redirect_from[page_data.title]) {
					page_data.original_title
					// .from_title, .redirect_from_title
					= page_data.redirect_from = redirect_from[page_data.title];
				}
				// 可以利用 page_data.convert_from 來判別標題是否已經過繁簡轉換。
				if (convert_from && convert_from[page_data.title]) {
					page_data.original_title
					// .from_title, .convert_from_title
					= page_data.convert_from = convert_from[page_data.title];
				}
				page_list.push(page_data);
			}

			if (data.warnings && data.warnings.query
			//
			&& typeof data.warnings.query['*'] === 'string') {
				/**
				 * 2016/6/27 22:23:25 修正: 處理當非 bot 索求過多頁面時之回傳。<br />
				 * e.g., <code>
				 * { batchcomplete: '', warnings: { query: { '*': 'Too many values supplied for parameter \'pageids\': the limit is 50' } },
				 * query: { pages: { '0000': [Object],... '0000': [Object] } } }
				 * </code>
				 */
				if (data.warnings.query['*'].includes('the limit is ')) {
					// TODO: 注記此時真正取得之頁面數。
					// page_list.OK_length = page_list.length;
					page_list.truncated = true;
				}
			}

			// options.multi: 即使只取得單頁面，依舊回傳 Array。
			if (!options.multi) {
				if (page_list.length <= 1) {
					// e.g., pages: { '1850031': [Object] }
					library_namespace.debug('只取得單頁面 '
					//
					+ get_page_title_link(page_list)
					//
					+ '，將回傳此頁面內容，而非 Array。', 2, 'wiki_API.page');
					page_list = page_list[0];
					if (is_api_and_title(title, true)) {
						title = title[1];
					}
					if (get_page_content.is_page_data(title)) {
						// 去除掉可能造成誤判的錯誤標記 'missing'。
						// 即使真有錯誤，也由page_list提供即可。
						if ('missing' in title) {
							delete title.missing;
							// 去掉該由page_list提供的資料。因為下次呼叫時可能會被利用到。例如之前找不到頁面，.pageid被設成-1，下次呼叫被利用到就會出問題。
							// ** 照理說這兩者都必定會出現在page_list。
							// delete title.pageid;
							// delete title.title;
						}
						// import data to original page_data. 盡可能多保留資訊。
						page_list = Object.assign(title, page_list);
					}
					if (page_list && get_content
					//
					&& (page_list.is_Flow = is_Flow(page_list))
					// e.g., { flow_view : 'header' }
					&& options.flow_view) {
						Flow_page(page_list, callback, options);
						return;
					}

				} else {
					library_namespace.debug('Get ' + page_list.length
					//
					+ ' page(s)! The pages will all '
					//
					+ 'passed to the callback as Array!', 2, 'wiki_API.page');
				}

			} else if ((options.multi === KEY_KEEP_INDEX
			// options.keep_order
			|| options.multi === KEY_KEEP_ORDER)
			//
			&& is_api_and_title(title, true)
			//
			&& Array.isArray(title[1]) && title[1].length >= 2) {
				var order_hash = title[1].to_hash(), ordered_list = [];
				// console.log(title[1].join('|'));
				// console.log(order_hash);

				if (false) {
					// another method
					// re-sort page list
					page_list.sort(function(page_data_1, page_data_2) {
						return order_hash[page_data_1.original_title
						//
						|| page_data_1.title]
						//
						- order_hash[page_data_2.original_title
						//
						|| page_data_2.title];
					});
					console.log(page_list.map(function(page_data) {
						return page_data.original_title
						//
						|| page_data.title;
					}).join('|'));
					throw 're-sort page list';
				}

				// 維持頁面的順序與輸入的相同。
				page_list.forEach(function(page_data) {
					var original_title = page_data.original_title
					//
					|| page_data.title;
					if (original_title in order_hash) {
						ordered_list[order_hash[original_title]] = page_data;
					} else {
						console.log(page_data);
						console.log('-'.repeat(70)
						//
						+ '\nPage list:\n' + title[1].join('\n'));
						throw 'wiki_API.page: 取得了未指定的頁面: '
						//
						+ get_page_title_link(original_title);
					}
				});
				// 緊湊化，去掉沒有設定到的頁面。
				if (options.multi === KEY_KEEP_ORDER) {
					ordered_list = ordered_list.filter(function(page_data) {
						return !!page_data;
					});
				}

				// copy attributes form original page_list
				[ 'OK_length', 'truncated',
				//
				'redirects', 'redirect_from', 'converted', 'convert_from' ]
				// 需要注意page_list可能帶有一些已經設定的屬性值，因此不能夠簡單的直接指派到另外一個值。
				.forEach(function(attribute_name) {
					if (attribute_name in page_list) {
						ordered_list[attribute_name]
						//
						= page_list[attribute_name];
					}
				});
				page_list = ordered_list;
			}

			if (options.save_response) {
				// 附帶原始回傳查詢資料。
				// save_data, query_data
				// assert: !('response' in page_list)
				page_list.response = data;
			}

			if (options.expandtemplates) {
				// 需要expandtemplates的情況。
				if (!Array.isArray(page_list)) {
					// TODO: test
					var revision = get_page_content.revision(page_list);
					// 出錯時 revision 可能等於 undefined。
					if (!revision) {
						callback(page_list);
						return;
					}
					wiki_API_expandtemplates(revision['*'] || '', function() {
						callback(page_list);
					}, Object.assign({
						page : page_list,
						title : page_data.title,
						revid : revision.revid,
						includecomments : options.includecomments,

						session : options[KEY_SESSION]
					}, options.expandtemplates));
					return;
				}

				// TODO: test
				page_list.run_async(function(run_next, page_data, index) {
					var revision = get_page_content.revision(page_data);
					wiki_API_expandtemplates(revision['*'], run_next,
					//
					Object.assign({
						page : page_data,
						title : page_data.title,
						revid : revision && revision.revid,
						includecomments : options.includecomments,

						session : options[KEY_SESSION]
					}, options.expandtemplates));
				}, function() {
					callback(page_list);
				});
				return;
			}

			// 一般正常回傳。

			// page 之 structure 將按照 wiki API 本身之 return！
			// page_data = {pageid,ns,title,revisions:[{timestamp,'*'}]}
			callback(page_list);

		}, null, options);
	};

	// default properties of revisions
	// timestamp 是為了 wiki_API.edit 檢查用。
	wiki_API.page.rvprop = 'content|timestamp';

	// @see https://www.mediawiki.org/w/api.php?action=help&modules=query
	wiki_API.page.auto_converttitles = 'zh,gan,iu,kk,ku,shi,sr,tg,uz'
			.split(',');

	// ------------------------------------------------------------------------

	/**
	 * 展開內容
	 * 
	 * 這種方法不能展開 module
	 * 
	 * @example <code>

	wiki.page(title, function(page_data) {
		console.log(CeL.wiki.content_of(page_data, 'expandtemplates'));
	}, {
		expandtemplates : true
	});

	 </code>
	 * 
	 * @see wiki_API.protect
	 */
	function wiki_API_expandtemplates(wikitext, callback, options) {
		var action = 'expandtemplates', post_data = {
			text : wikitext,
			prop : 'wikitext'
		};

		options = library_namespace.new_options(options);

		for ( var parameter in wiki_API_expandtemplates.parameters) {
			if (parameter in options) {
				if (options[parameter] || options[parameter] === 0)
					post_data[parameter] = options[parameter];
			}
		}

		var session = options[KEY_SESSION];
		if (session && session.API_URL) {
			action = [ session.API_URL, action ];
		}

		wiki_API.query(action, function(data) {
			var error = data && data.error;
			// 檢查伺服器回應是否有錯誤資訊。
			if (error) {
				library_namespace.error('wiki_API_expandtemplates: ['
				//
				+ error.code + '] ' + error.info);
				typeof callback === 'function'
				//
				&& callback(undefined, errpr);
				return;
			}

			if (options.page) {
				// use page_data.expandtemplates.wikitext
				Object.assign(options.page, data);
			}

			typeof callback === 'function'
			//
			&& callback(data.expandtemplates);

		}, post_data, options);
	}

	wiki_API_expandtemplates.parameters = {
		title : undefined,
		// text : wikitext,
		revid : undefined,
		prop : undefined,
		includecomments : undefined,

		templatesandboxprefix : undefined,
		templatesandboxtitle : undefined,
		templatesandboxtext : undefined,
		templatesandboxcontentmodel : undefined,
		templatesandboxcontentformat : undefined
	};

	wiki_API.expandtemplates = wiki_API_expandtemplates;

	// ------------------------------------------------------------------------

	// 強制更新/清除緩存並重新載入/重新整理/刷新頁面。
	// @see https://www.mediawiki.org/w/api.php?action=help&modules=purge
	// 極端做法：[[WP:NULL|Null edit]], re-edit the same contents
	wiki_API.purge = function(title, callback, options) {
		var action = normalize_title_parameter(title, options);
		if (!action) {
			throw 'wiki_API.purge: Invalid title: '
					+ get_page_title_link(title);
		}

		// POST_parameters
		var post_data = action[1];
		action[1] = 'purge';
		if (!action[0]) {
			action = action[1];
		}

		wiki_API.query(action, typeof callback === 'function'
		//
		&& function(data) {
			// copy from wiki_API.redirects()

			var error = data && data.error;
			// 檢查伺服器回應是否有錯誤資訊。
			if (error) {
				library_namespace.error(
				//
				'wiki_API.purge: [' + error.code + '] ' + error.info);
				if (data.warnings && data.warnings.query
				//
				&& data.warnings.query['*'])
					library_namespace.warn(data.warnings.query['*']);
				callback(undefined, error);
				return;
			}

			// data:
			// {"batchcomplete":"","purge":[{"ns":4,"title":"Title","purged":""}]}

			if (!data || !data.purge) {
				library_namespace.warn(
				//
				'wiki_API.purge: Unknown response: ['
				//
				+ (typeof data === 'object' && typeof JSON !== 'undefined'
				//
				? JSON.stringify(data) : data) + ']');
				if (library_namespace.is_debug()
				// .show_value() @ interact.DOM, application.debug
				&& library_namespace.show_value)
					library_namespace.show_value(data);
				callback(undefined, 'Unknown response');
				return;
			}

			// callback({Array}pages)
			callback(data.purge);
		}, post_data, options);
	};

	// ------------------------------------------------------------------------

	/**
	 * 檢查頁面是否被保護。
	 * 
	 * 採用如:
	 * 
	 * @example <code>

	wiki.page(title, function(page_data) {
		console.log(CeL.wiki.is_protected(page_data));
	}, {
		prop : 'revisions|info',
		// rvprop : 'ids|timestamp',
		// https://www.mediawiki.org/w/api.php?action=help&modules=query%2Binfo
		// https://www.mediawiki.org/wiki/API:Info#inprop.3Dprotection
		additional : 'inprop=protection'
	});

	 </code>
	 * 
	 * @see wiki_API.protect
	 */
	wiki_API.is_protected = function has_protection(page_data) {
		var protection_list = page_data.protection || page_data;
		if (!Array.isArray(protection_list)) {
			return;
		}

		// https://www.mediawiki.org/w/api.php?action=help&modules=query%2Binfo
		// https://www.mediawiki.org/wiki/API:Info#inprop.3Dprotection
		return protection_list.some(function(protection) {
			return protection.type === 'edit' && protection.level === 'sysop';
		});
	};

	// ------------------------------------------------------------------------

	/**
	 * 取得頁面之重定向資料（重新導向至哪一頁）。
	 * 
	 * 注意: 重定向僅代表一種強烈的關聯性，而不表示從屬關係(對於定向到章節的情況)或者等價關係。
	 * 例如我們可能將[[有罪推定]]定向至[[無罪推定]]，然而雙方是完全相反的關係。
	 * 只因為[[無罪推定]]是一種比較值得關注的特性，而[[有罪推定]]沒有特殊的性質(common)。因此我們只談[[無罪推定]]，不會特別拿[[有罪推定]]出來談。
	 * 
	 * TODO:
	 * https://www.mediawiki.org/w/api.php?action=help&modules=searchtranslations
	 * 
	 * @example <code>

	CeL.wiki.redirect_to('史記', function(redirect_data, page_data) {
		CeL.show_value(redirect_data);
	});

	 </code>
	 * 
	 * @param {String|Array}title
	 *            title or [ {String}API_URL, {String}title or {Object}page_data ]
	 * @param {Function}[callback]
	 *            回調函數。 callback({String}title that redirect to or {Object}with
	 *            redirect to what section, {Object}page_data, error)
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * 
	 * @see https://www.mediawiki.org/w/api.php?action=help&modules=query%2Brevisions
	 */
	wiki_API.redirect_to = function(title, callback, options) {
		wiki_API.page(title, function(page_data, error) {
			if (error || !page_data || ('missing' in page_data)) {
				// error? 此頁面不存在/已刪除。
				callback(undefined, page_data, error);
				return;
			}

			// e.g., [ { from: 'AA', to: 'A', tofragment: 'aa' } ]
			// e.g., [ { from: 'AA', to: 'A', tofragment: '.AA.BB.CC' } ]
			var redirect_data = page_data.response.query.redirects;
			if (redirect_data) {
				if (redirect_data.length !== 1) {
					// 可能是多重重定向？
					// e.g., A→B→C
					library_namespace.warn('wiki_API.redirect_to: Get '
							+ redirect_data.length + ' redirect links for ['
							// title.join(':')
							+ title + ']!');
					library_namespace.warn(redirect_data);
				}
				// 僅取用並回傳第一筆資料。
				redirect_data = redirect_data[0];
				// assert: redirect_data && redirect_data.to === page_data.title

				// test if is #REDIRECT [[title#section]]
				if (redirect_data.tofragment) {
					try {
						redirect_data.to_link = redirect_data.to + '#'
						// 須注意: 對某些 section 可能 throw！
						+ decodeURIComponent(redirect_data.tofragment
						//
						.replace(/\./g, '%'));
					} catch (e) {
						redirect_data.to_link = redirect_data.to + '#'
						//
						+ redirect_data.tofragment;
					}
					library_namespace.debug(get_page_title_link(title)
					// →
					+ ' redirected to section [[' + redirect_data.to + '#'
							+ redirect_data.tofragment + ']]!', 1,
							'wiki_API.redirect_to');
					callback(redirect_data, page_data);
					return;
				}

			}

			// page_data.title is normalized title.
			callback(page_data.title, page_data);

		}, Object.assign({
			// 輸入 prop:'' 或再加上 redirects:1 可以僅僅確認頁面是否存在，以及頁面的正規化標題。
			prop : '',
			redirects : 1,
			// Only works if the wiki's content language supports variant
			// conversion. en, crh, gan, iu, kk, ku, shi, sr, tg, uz and zh.
			// converttitles : 1,
			save_response : true
		}, options));
	};

	// ------------------------------------------------------------------------

	if (false) {
		CeL.wiki.langlinks('文明', function(title) {
			title === 'Civilization';
			if (title)
				CeL.show_value(title);
		}, 'en');

		CeL.wiki.langlinks([ 'en', 'Civilization' ], function(title) {
			title === '文明';
			if (title)
				CeL.show_value(title);
		}, 'zh');

		// TODO?
		// return 'title' or {langs:['',''], lang:'title'}
		CeL.wiki.langlinks('文明', function(title) {
			if (title)
				CeL.show_value(title);
		}) == CeL.wiki.langlinks('文明', function(title) {
			if (title)
				CeL.show_value(title);
		}, 10)
		// == {langs:['',''], lang:'title'}

		// 未指定 page，表示已完成。
	}

	/**
	 * 取得 title 在其他語系 (to_lang) 之標題。 Interlanguage title. 可一次處理多個標題。
	 * 
	 * @param {String|Array}title
	 *            the page title to search continue information
	 * @param {Function|Object}callback
	 *            回調函數 or options。
	 * @param {String}to_lang
	 *            所欲求語言。
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * 
	 * @see https://www.mediawiki.org/wiki/API:Langlinks
	 *      https://www.mediawiki.org/wiki/Manual:Langlinks_table
	 */
	wiki_API.langlinks = function(title, callback, to_lang, options) {
		var from_lang;
		if (is_api_and_title(title, 'language', true)) {
			from_lang = title[0];
			title = title[1];
		}
		title = 'query&prop=langlinks&'
				+ wiki_API.query.title_param(title, true, options
						&& options.is_id);
		if (to_lang) {
			title += (to_lang > 0 || to_lang === 'max' ? '&lllimit='
					: '&lllang=')
					+ to_lang;
		}
		if (options && (options.limit > 0 || options.limit === 'max'))
			title += '&lllimit=' + options.limit;
		// console.log('ll title:' + title);
		if (from_lang) {// llinlanguagecode 無效。
			title = [ from_lang, title ];
		}

		wiki_API.query(title, typeof callback === 'function'
		//
		&& function(data) {
			if (!data || !data.query || !data.query.pages) {
				/**
				 * From version 1.25 onwards, the API returns a batchcomplete
				 * element to indicate that all data for the current "batch" of
				 * pages has been returned.
				 * 
				 * @see https://www.mediawiki.org/wiki/API:Query#batchcomplete
				 */
				if (library_namespace.is_Object(data)
				// status 503 時，data 可能為 string 之類。
				&& ('batchcomplete' in data)) {
					// assert: data.batchcomplete === ''
					library_namespace.debug(get_page_title_link(title)
					//
					+ ': Done.', 1, 'wiki_API.langlinks');
				} else {
					library_namespace.warn(
					//
					'wiki_API.langlinks: Unknown response: ['
					//
					+ (typeof data === 'object' && typeof JSON !== 'undefined'
					//
					? JSON.stringify(data) : data) + ']');
					// console.log(data);
				}
				// console.warn(data);
				if (library_namespace.is_debug()
				// .show_value() @ interact.DOM, application.debug
				&& library_namespace.show_value)
					library_namespace.show_value(data);
				callback();
				return;
			}

			data = data.query.pages;
			var pages = [];
			for ( var pageid in data)
				pages.push(data[pageid]);
			if (pages.length !== 1 || (options && options.multi)) {
				if (library_namespace.is_debug()) {
					library_namespace.info(
					//
					'wiki_API.langlinks: Get ' + pages.length
					//
					+ ' page(s)! We will pass all pages to callback!');
				}
				// page 之 structure 按照 wiki API 本身之 return！
				// page = {pageid,ns,title,revisions:[{langlinks,'*'}]}
				callback(pages);
			} else {
				if (library_namespace.is_debug() && !pages[0].langlinks) {
					library_namespace.warn('wiki_API.langlinks: '
					//
					+ ('pageid' in pages[0] ? '無' + (to_lang && isNaN(to_lang)
					//
					? '所欲求語言[' + to_lang + ']之' : '其他語言')
					//
					+ '連結' : '不存在/已刪除此頁面') + ': [' + pages[0].title + ']');
					// library_namespace.show_value(pages);
				}
				pages = pages[0].langlinks;
				callback(pages ? to_lang && isNaN(to_lang) ? pages[0]['*']
				//
				: wiki_API.langlinks.parse(pages) : pages);
			}
		}, null, options);
	};

	wiki_API.langlinks.parse = function(langlinks, to_lang) {
		if (langlinks && Array.isArray(langlinks.langlinks)) {
			langlinks = langlinks.langlinks;
		}

		if (!Array.isArray(langlinks)) {
			if (library_namespace.is_debug()) {
				library_namespace.warn(
				//
				'wiki_API.langlinks.parse: No langlinks exists?'
						+ (langlinks && langlinks.title ? ' '
								+ get_page_title_link(langlinks) : ''));
				if (library_namespace.is_debug(2)
				// .show_value() @ interact.DOM, application.debug
				&& library_namespace.show_value)
					library_namespace.show_value(langlinks, 'langlinks.parse');
			}
			return;
		}

		var langs;
		if (to_lang) {
			langlinks.some(function(lang) {
				if (to_lang == lang.lang) {
					langs = lang['*'];
					return true;
				}
			});

		} else {
			langs = Object.create(null);
			langs.langs = [];
			langlinks.forEach(function(lang) {
				langs[lang.lang] = lang['*'];
				langs.langs.push(lang.lang);
			});
		}
		return langs;
	};

	// ------------------------------------------------------------------------

	if (false) {
		CeL.wiki.convert('中国', function(text) {
			text === "中國";
		});
	}

	// 繁簡轉換
	wiki_API.convert = function(text, callback, uselang) {
		if (!text) {
			callback('');
			return;
		}

		// 作基本的 escape。不能用 encodeURIComponent()，這樣會把中文也一同 escape 掉。
		// 多一層 encoding，避免 MediaWiki parser 解析 HTML。
		text = escape(text)
		// recover special characters (e.g., Chinese words) by unescape()
		.replace(/%u[\dA-F]{4}/g, unescape);
		// assert: 此時 text 不應包含任何可被 MediaWiki parser 解析的語法。

		// assert: '!' === encodeURIComponent('!')
		text = '!' + encodeURIComponent(text) + '!';

		// 由於用 [[link]] 也不會自動 redirect，因此直接轉換即可。
		wiki_API.query([ api_URL('zh'),
		// https://zh.wikipedia.org/w/api.php?action=query&meta=siteinfo&siprop=languages&utf8=1
		'action=parse&contentmodel=wikitext&uselang=' + (uselang || 'zh-hant')
		// prop=text|links
		+ '&prop=text&text=' + text ], function(data, error) {
			if (error || !data) {
				callback('', error);
				return;
			}
			data = data.parse;
			text = data.text['*']
			// 去掉 MediaWiki parser 解析器所自行添加的 token 與註解。
			.replace(/<!--[\s\S]*?-->/g, '')
			// 去掉前後包覆。 e.g., <p> or <pre>
			.replace(/![^!]*$/, '').replace(/^[^!]*!/, '');
			try {
				// recover special characters
				text = unescape(text);
				callback(text);
			} catch (e) {
				callback(undefined, e);
			}
		});
	};

	// ------------------------------------------------------------------------

	/**
	 * 自 title 頁面取得後續檢索用索引值 (continuation data)。<br />
	 * e.g., 'continue'
	 * 
	 * @param {String|Array}title
	 *            the page title to search continue information
	 * @param {Function|Object}callback
	 *            回調函數 or options。 callback({Object} continue data);
	 * 
	 * @see https://www.mediawiki.org/wiki/API:Query#Continuing_queries
	 */
	function get_continue(title, callback) {
		var options;
		if (library_namespace.is_Object(callback)) {
			callback = (options = callback).callback;
		} else {
			// 前置處理。
			options = Object.create(null);
		}

		wiki_API.page(title, function(page_data) {
			var matched, done, content = get_page_content(page_data),
			// {RegExp}[options.pattern]:
			// content.match(pattern) === [ , '{type:"continue"}' ]
			pattern = options.pattern,
			// {Object} continue data
			data = Object.create(null);

			if (!pattern) {
				pattern = new RegExp(library_namespace.to_RegExp_pattern(
				//
				(options.continue_key || wiki_API.prototype.continue_key)
						.trim())
						+ ' *:? *({[^{}]{0,80}})', 'g');
			}
			library_namespace.debug('pattern: ' + pattern, 2, 'get_continue');

			while (matched = pattern.exec(content)) {
				library_namespace.debug('continue data: [' + matched[1] + ']',
						2, 'get_continue');
				if (!(done = /^{\s*}$/.test(matched[1])))
					data = Object.assign(data,
					//
					library_namespace.parse_JSON(matched[1]));
			}

			// options.get_all: get all continue data.
			if (!options.get_all)
				if (done) {
					library_namespace.debug('最後一次之後續檢索用索引值為空，可能已完成？', 1,
							'get_continue');
					data = null;
				} else {
					// {String|Boolean}[options.type]: what type to search.
					matched = options.type;
					if (matched in get_list.type)
						matched = get_list.type[matched] + 'continue';

					content = data;
					data = Object.create(null);
					if (matched in content) {
						data[matched] = content[matched];
					}
				}

			// callback({Object} continue data);
			callback(data || Object.create(null));
		}, options);
	}

	// ------------------------------------------------------------------------

	if (false) {
		// 若是想一次取得所有 list，不應使用單次版:
		// 注意: arguments 與 get_list() 之 callback 連動。
		wiki.categorymembers('Category_name', function(pages, titles, title) {
			console.log(pages.length);
		}, {
			limit : 'max'
		});

		// 而應使用循環取得資料版:
		CeL.wiki.cache({
			type : 'categorymembers',
			list : 'Category_name',
		}, function(list) {
			CeL.log('Get ' + list.length + ' item(s).');
		}, {
			// default options === this
			// https://www.mediawiki.org/w/api.php?action=help&modules=query%2Bcategorymembers
			namespace : '0|1',
			// [KEY_SESSION]
			session : wiki,
			// title_prefix : 'Template:',
			// cache path prefix
			prefix : base_directory
		});
	}

	/**
	 * get list. 檢索/提取列表<br />
	 * 注意: 可能會改變 options！
	 * 
	 * TODO: options.get_sub options.ns
	 * 
	 * @param {String}type
	 *            one of get_list.type
	 * @param {String}[title]
	 *            page title 頁面標題。
	 * @param {Function}callback
	 *            回調函數。 callback(pages, titles, title)<br />
	 *            注意: arguments 與 get_list() 之 callback 連動。
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 */
	function get_list(type, title, callback, options) {
		library_namespace.debug(type
				+ (title ? ' ' + get_page_title_link(title) : '')
				+ ', callback: ' + callback, 3, 'get_list');

		var parameter,
		// 預處理器
		title_preprocessor,
		/** {String} 前置字首。 */
		prefix = get_list.type[type];
		library_namespace.debug('parameters: ' + JSON.stringify(prefix), 3,
				'get_list');
		if (Array.isArray(prefix)) {
			parameter = prefix[1] || get_list.default_parameter;
			title_preprocessor = prefix[2];
			prefix = prefix[0];
		} else {
			parameter = get_list.default_parameter;
		}

		if (typeof options === 'string' || !isNaN(options)) {
			// 當作 namespace。
			options = {
				// {ℕ⁰:Natural+0|String|Object}namespace
				// one of get_namespace.hash.
				namespace : options
			};
		} else if (!library_namespace.is_Object(options)) {
			options = {
				// original option
				namespace : options
			};
		}
		if ('namespace' in options) {
			// 檢查 options.namespace。
			options.namespace = get_namespace(options.namespace);
			if (options.namespace === undefined) {
				library_namespace
						.warn('get_list: options.namespace 並非為正規 namespace！將被忽略！');
				delete options.namespace;
			}
		}

		// 處理 [ {String}API_URL, {String}title or {Object}page_data ]
		if (!Array.isArray(title))
			title = [ , title ];

		var continue_from = prefix + 'continue',
		// {wiki_API}options.continue_session: 藉以取得後續檢索用索引值之 {wiki_API}。
		// 若未設定 .next_mark，才會自 options.get_continue 取得後續檢索用索引值。
		continue_session = options.continue_session;
		if (continue_session) {
			if (continue_session.constructor === wiki_API) {
				library_namespace.debug(
						'直接傳入了 {wiki_API}；可延續使用上次的後續檢索用索引值，避免重複 loading page。',
						4, 'get_list');
				// usage:
				// options: { continue_session : wiki_API instance ,
				// get_continue : log_to }
				// 注意: 這裡會改變 options！
				// assert: {Object}continue_session.next_mark
				if (continue_from in continue_session.next_mark) {
					// {String}continue_session.next_mark[continue_from]:
					// 後續檢索用索引值。
					options[continue_from] = continue_session.next_mark[continue_from];
					// 經由,經過,通過來源
					library_namespace.info('get_list: continue from ['
							+ options[continue_from] + '] via {wiki_API}');
					// 刪掉標記，避免無窮迴圈。
					delete options.get_continue;
				} else {
					// 設定好 options.get_continue，以進一步從 page 取得後續檢索用索引值。
					if (typeof options.get_continue === 'string')
						// 採用 continue_session 之 domain。
						options.get_continue = [ continue_session.API_URL,
								options.get_continue ];
				}
			} else {
				library_namespace.debug('傳入的不是 {wiki_API}。 ', 4, 'get_list');
				continue_session = undefined;
			}
		}

		// options.get_continue: 用以取用後續檢索用索引值之 title。
		// {String}title || {Array}[ API_URL, title ]
		if (options.get_continue) {
			// 在多人共同編輯的情況下，才需要每次重新 load page。
			get_continue(Array.isArray(options.get_continue)
			//
			? options.get_continue : [ title[0], options.get_continue ], {
				type : type,
				// [KEY_SESSION]
				session : continue_session || options[KEY_SESSION],
				continue_key : (continue_session || options[KEY_SESSION])
				//
				.continue_key,
				callback : function(continuation_data) {
					if (continuation_data = continuation_data[continue_from]) {
						library_namespace.info('get_list: continue from ['
								+ continuation_data + '] via page');
						// 注意: 這裡會改變 options！
						// 刪掉標記，避免無窮迴圈。
						delete options.get_continue;
						// 設定/紀錄後續檢索用索引值，避免無窮迴圈。
						if (continue_session)
							continue_session.next_mark

							[continue_from] = continuation_data;
						else
							options[continue_from] = continuation_data;
						get_list(type, title, callback, options);

					} else {
						// delete options[continue_from];
						library_namespace.debug('Nothing to continue!', 1,
								'get_list');
						if (typeof callback === 'function') {
							callback();
						}
					}
				}
			});
			return;
		}

		if (continue_from = options[continue_from]) {
			library_namespace.debug(type
					+ (title ? ' ' + get_page_title_link(title) : '')
					+ ': start from ' + continue_from, 2, 'get_list');
		}

		title[1] = title[1] ? '&'
		// allpages 不具有 title。
		+ (parameter === get_list.default_parameter ? prefix : '')
		// 不能設定 wiki_API.query.title_param(title, true)，有些用 title 而不用 titles。
		// e.g., 20150916.Multiple_issues.v2.js
		+ wiki_API.query.title_param(title[1]/* , true, options.is_id */) : '';

		if (typeof title_preprocessor === 'function') {
			// title_preprocessor(title_parameter)
			library_namespace.debug('title_parameter: [' + title[1] + ']', 3,
					'get_list');
			title[1] = title_preprocessor(title[1], options);
			library_namespace.debug('→ [' + title[1] + ']', 3, 'get_list');
		}

		title[1] = 'query&' + parameter + '=' + type + title[1]
		// 處理數目限制 limit。
		// No more than 500 (5,000 for bots) allowed.
		+ (options.limit > 0 || options.limit === 'max'
		// @type integer or 'max'
		// https://www.mediawiki.org/w/api.php?action=help&modules=query%2Brevisions
		? '&' + prefix + 'limit=' + options.limit : '')
		// next start from here.
		+ (continue_from ?
		// allpages 的 apcontinue 為 title，需要 encodeURIComponent()。
		'&' + prefix + 'continue='
		// 未處理allpages 的 escape 可能造成 HTTP status 400。
		+ encodeURIComponent(continue_from) : '')
		//
		+ ('namespace' in options
		//
		? '&' + prefix + 'namespace=' + options.namespace : '');

		for ( var parameter in options) {
			if (parameter.startsWith(prefix)) {
				title[1] += '&' + parameter + '='
						+ encodeURIComponent(options[parameter]);
			}
		}

		add_parameters(title, options);

		// TODO: 直接以是不是 .startsWith(prefix) 來判定是不是該加入 parameters。

		if (!title[0])
			title = title[1];
		// console.log('get_list: title: ' + title);

		if (typeof callback !== 'function') {
			library_namespace.error('callback is NOT function! callback: ['
					+ callback + ']');
			library_namespace.debug('可能是想要當作 wiki instance，卻未設定好，直接呼叫了 '
			// TODO: use module_name
			+ library_namespace.Class + '.wiki？\ne.g., 想要 var wiki = '
					+ library_namespace.Class
					+ '.wiki(user, password) 卻呼叫了 var wiki = '
					+ library_namespace.Class + '.wiki？', 3);
			return;
		}

		wiki_API.query(title,
		// treat as {Function}callback or {Object}wiki_API.work config.
		function(data) {
			function add_page(page) {
				titles.push(page.title);
				pages.push(page);
			}

			if (library_namespace.is_debug(2)
			// .show_value() @ interact.DOM, application.debug
			&& library_namespace.show_value) {
				library_namespace.show_value(data, 'get_list: ' + type);
			}

			// {Array}title_list
			var titles = [],
			// {Array}page_list
			pages = [],
			// 取得列表後，設定/紀錄新的後續檢索用索引值。
			// https://www.mediawiki.org/wiki/API:Query#Backwards_compatibility_of_continue
			// {Object}next_index: 後續檢索用索引值。
			next_index = data && (data['continue'] || data['query-continue']);
			if (!continue_session) {
				continue_session = options[KEY_SESSION];
				// assert: continue_session &&
				// library_namespace.is_Object(continue_session.next_mark)
			}
			if (library_namespace.is_Object(next_index)) {
				pages.next_index = next_index;
				library_namespace.debug(
						'因為 continue_session 可能與作業中之 wiki_API instance 不同，'
						//
						+ '因此需要在本函數 function get_list() 中設定好。', 4, 'get_list');
				// console.log(continue_session);
				if (continue_session) {
					// console.log(continue_session.next_mark);
					// console.log(next_index);
					// console.log(continue_session);
					if ('query-continue' in data) {
						// style of 2014 CE. 例如:
						// {backlinks:{blcontinue:'[0|12]'}}
						for ( var type_index in next_index)
							Object.assign(continue_session.next_mark,
									next_index[type_index]);
					} else {
						// nowadays. e.g.,
						// {continue: { blcontinue: '0|123', continue: '-||' }}
						Object.assign(continue_session.next_mark, next_index);
					}
					library_namespace.debug('next index of ' + type + ': '
							+ continue_session.show_next());
				}
				if (library_namespace.is_debug(2)
				// .show_value() @ interact.DOM, application.debug
				&& library_namespace.show_value)
					library_namespace.show_value(next_index,
							'get_list: get the continue value');
				if (options.limit === 'max' && type.includes('users')) {
					library_namespace.debug(
					//
					'Too many users so we do not get full list'
					//
					+ (options.augroup ? ' of [' + options.augroup + ']' : '')
							+ '!', 1, 'get_list');
					// 必須重複手動呼叫。
				}

			} else if (library_namespace.is_Object(data)
			// ↑ 在503的時候data可能是字串。
			&& ('batchcomplete' in data) && continue_session) {
				// ↑ check "batchcomplete"
				var keyword_continue = get_list.type[type];
				if (keyword_continue) {
					if (Array.isArray(keyword_continue)) {
						keyword_continue = keyword_continue[0];
					}
					// e.g., "cmcontinue"
					keyword_continue += 'continue';
					if (keyword_continue in continue_session.next_mark) {
						library_namespace.debug('去除已經不需要的檢索用索引值。', 3,
								'get_list');
						// needless.
						delete continue_session.next_mark[keyword_continue];
					}
				}
			}

			// 紀錄清單類型。
			// assert: overwrite 之屬性不應該是原先已經存在之屬性。
			pages.list_type = type;
			if (get_page_content.is_page_data(title)) {
				title = title.title;
			}

			if (!data || !data.query) {
				library_namespace.error('get_list: Unknown response: ['
						+ (typeof data === 'object'
								&& typeof JSON !== 'undefined' ? JSON
								.stringify(data) : data) + ']');
				callback(pages, titles, title);

			} else if (data.query[type]) {
				// 一般情況。
				if (Array.isArray(data = data.query[type])) {
					data.forEach(add_page);
				}

				library_namespace.debug(get_page_title_link(title) + ': '
						+ titles.length + ' page(s)', 2, 'get_list');
				// 注意: arguments 與 get_list() 之 callback 連動。
				// 2016/6/22 change API 應用程式介面變更:
				// (title, titles, pages) → (pages, titles, title)
				// 按照需求程度編配/編排 arguments。
				// 因為 callback 所欲知最重要的資訊是 pages，因此將 pages 置於第一 argument。
				callback(pages, titles, title);

			} else {
				// console.log(data.query);
				data = data.query.pages;
				for ( var pageid in data) {
					if (pages.length) {
						library_namespace
								.warn('get_list: More than 1 page got!');
					} else {
						var page = data[pageid];
						if (Array.isArray(page[type]))
							page[type].forEach(add_page);

						library_namespace.debug('[' + page.title + ']: '
								+ titles.length + ' page(s)', 1, 'get_list');
						// 注意: arguments 與 get_list() 之 callback 連動。
						callback(pages, titles, page.title);
					}
					return;
				}
				library_namespace.error('get_list: No page got!');
			}
		}, null, options);
	}

	// const: 基本上與程式碼設計合一，僅表示名義，不可更改。
	get_list.default_parameter = 'list';

	/**
	 * All list types MediaWiki supported.
	 * 
	 * @type {Object}
	 * 
	 * @see https://www.mediawiki.org/wiki/API:Lists/All
	 */
	get_list.type = {

		// 'type name' : 'abbreviation 縮寫 / prefix' (parameter :
		// get_list.default_parameter)

		// 按標題排序列出指定的名字空間的頁面 title。
		// 可用來遍歷所有頁面。
		// includes redirection 包含重定向頁面.
		// @see traversal_pages()
		// https://www.mediawiki.org/wiki/API:Allpages
		// 警告: 不在 Wikimedia Toolforge 上執行 allpages 速度太慢。但若在
		// Wikimedia Toolforge，當改用 database。
		allpages : 'ap',

		// https://www.mediawiki.org/wiki/API:Alllinks
		// https://www.mediawiki.org/w/api.php?action=help&modules=query%2Balllinks
		alllinks : 'al',

		// https://www.mediawiki.org/w/api.php?action=help&modules=query%2Ballusers
		allusers : 'au',

		/**
		 * 為頁面標題執行前綴搜索。<br />
		 * <code>
		// 注意: arguments 與 get_list() 之 callback 連動。
		CeL.wiki.prefixsearch('User:Cewbot/log/20151002/', function(pages, titles, title){ console.log(titles); }, {limit:'max'});
		wiki_instance.prefixsearch('User:Cewbot', function(pages, titles, title){ console.log(titles); }, {limit:'max'});
		 * </code>
		 * 
		 * @see https://www.mediawiki.org/w/api.php?action=help&modules=query%2Bprefixsearch
		 */
		prefixsearch : [ 'ps', , function(title_parameter) {
			return title_parameter.replace(/^&pstitle=/, '&pssearch=');
		} ],

		// 取得連結到 [[title]] 的頁面。
		// リンク元
		// e.g., [[name]], [[:Template:name]].
		// https://www.mediawiki.org/wiki/API:Backlinks
		backlinks : 'bl',

		// 取得所有[[w:zh:Wikipedia:嵌入包含]] title 的頁面。 (transclusion, inclusion)
		// 参照読み込み
		// e.g., {{Template name}}, {{/title}}.
		// 設定 title 'Template:tl' 可取得使用指定 Template 的頁面。
		// https://en.wikipedia.org/wiki/Wikipedia:Transclusion
		// https://www.mediawiki.org/wiki/API:Embeddedin
		embeddedin : 'ei',

		// **暫時使用wiki_API.redirects()，因為尚未整合，在跑舊程式20150916.Multiple_issues.v2.js會有問題。
		// 回傳連結至指定頁面的所有重新導向。 Returns all redirects to the given pages.
		// 転送ページ
		// https://www.mediawiki.org/w/api.php?action=help&modules=query%2Bredirects
		// redirects : 'rd',

		// 取得所有使用 file 的頁面。
		// title 必須包括File:前綴。
		// e.g., [[File:title.jpg]].
		// https://www.mediawiki.org/wiki/API:Imageusage
		imageusage : 'iu',

		// 列出在指定分類中的所有頁面。
		// https://www.mediawiki.org/w/api.php?action=help&modules=query%2Bcategorymembers
		// @see [[mw:Help:Tracking categories|追蹤分類]]
		categorymembers : [ 'cm', , function(title_parameter) {
			// 要列舉的分類（必需）。必須包括Category:前綴。不能與cmpageid一起使用。
			if (/^&cmtitle=[Cc]ategory%3A/.test(title_parameter))
				return title_parameter;
			return title_parameter.replace(/^&cmtitle=/, '&cmtitle=Category:');
		} ],

		// https://www.mediawiki.org/w/api.php?action=help&modules=query%2Brecentchanges
		recentchanges : 'rc',

		// https://www.mediawiki.org/w/api.php?action=help&modules=query%2Busercontribs
		// wiki.usercontribs(user_name,function(list){console.log(list);},{limit:80});
		// get new → old
		usercontribs : [ 'uc', , function(title_parameter) {
			return title_parameter.replace(/^&uctitle=/, '&ucuser=');
		} ],

		// 'type name' : [ 'abbreviation 縮寫 / prefix', 'parameter' ]
		// ** 可一次處理多個標題，但可能較耗資源、較慢。

		// TODO
		// **暫時使用wiki_API.langlinks()，因為尚未整合，在跑舊程式會有問題。
		NYI_langlinks : [ 'll', 'prop', function(title_parameter, options) {
			if (options && options.lang && typeof options.lang === 'string') {
				return title_parameter + '&lllang=' + options.lang;
			}
			return title_parameter;
		} ],

		// linkshere: 取得連結到 [[title]] 的頁面。
		// [[Special:Whatlinkshere]]
		// 使用說明:連入頁面
		// https://zh.wikipedia.org/wiki/Help:%E9%93%BE%E5%85%A5%E9%A1%B5%E9%9D%A2
		linkshere : [ 'lh', 'prop' ],

		// 取得所有使用 title (e.g., [[File:title.jpg]]) 的頁面。
		// 基本上同 imageusage。
		fileusage : [ 'fu', 'prop' ],

		// 回傳指定頁面的所有連結。
		// https://www.mediawiki.org/w/api.php?action=help&modules=query%2Blinks
		links : [ 'pl', 'prop', function(title_parameter) {
			return title_parameter.replace(/^&title=/, '&titles=');
		} ]
	};

	// setup wiki_API.prototype.methods
	(function wiki_API_prototype_methods() {
		// 登記 methods。
		var methods = wiki_API.prototype.next.methods;

		for ( var name in get_list.type) {
			methods.push(name);
			wiki_API[name] = get_list.bind(null, name);
		}

		// add method to wiki_API.prototype
		// setup other wiki_API.prototype methods.
		methods.forEach(function(method) {
			library_namespace.debug('add action to wiki_API.prototype: '
					+ method, 2);
			wiki_API.prototype[method] = function() {
				// assert: 不可改動 method @ IE！
				var args = [ method ];
				Array.prototype.push.apply(args, arguments);
				try {
					library_namespace.debug('add action: '
							+ args.map(JSON.stringify).join('<br />\n'), 3,
							'wiki_API.prototype.' + method);
				} catch (e) {
					// TODO: handle exception
				}
				this.actions.push(args);
				// TODO: 不應該僅以this.running判定，
				// 因為可能在.next()中呼叫本函數，這時雖然this.running===true，但已經不會再執行。
				if (!this.running
				// 當只剩下剛剛.push()進的operation時，表示已經不會再執行，則還是實行this.next()。
				// TODO: 若是其他執行序會操作this.actions、主動執行this.next()，
				// 或.next()正執行之其他操作會執行this.next()，可能造成重複執行的結果！
				// 2016/11/16 14:45:19 但這方法似乎會提早執行...
				// || this.actions.length === 1
				) {
					this.next();
				} else {
					library_namespace.debug('正在執行中，直接跳出。', 6,
							'wiki_API.prototype.' + method);
				}
				return this;
			};
		});
	})();

	// ------------------------------------------------------------------------

	/**
	 * 取得完整 list 後才作業。<br />
	 * 注意: 可能會改變 options！
	 * 
	 * @param {String}target
	 *            page title 頁面標題。
	 * @param {Function}callback
	 *            回調函數。 callback(pages, target, options)
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 */
	wiki_API.list = function(target, callback, options) {
		// 前置處理。
		if (!library_namespace.is_Object(options))
			options = Object.create(null);

		if (!options.initialized) {
			if (!options[KEY_SESSION]) {
				options[KEY_SESSION] = new wiki_API;
			}
			if (!options.type) {
				options.type = wiki_API.list.default_type;
			}
			options.initialized = true;
		}

		// 注意: arguments 與 get_list() 之 callback 連動。
		options[KEY_SESSION][options.type](target, function(pages, titles,
				title) {
			library_namespace.debug('Get ' + pages.length + ' ' + options.type
					+ ' pages of ' + get_page_title_link(title), 2,
					'wiki_API.list');
			if (typeof options.callback === 'function') {
				// options.callback() 為取得每一階段清單時所會被執行的函數。
				// 注意: arguments 與 get_list() 之 callback 連動。
				options.callback(pages, titles, title);
			}
			if (options.pages) {
				// Array.prototype.push.apply(options.pages, pages);
				options.pages.append(pages);
			} else {
				options.pages = pages;
			}
			if (pages.next_index) {
				library_namespace.debug('尚未取得所有清單，因此繼續取得下一階段清單。', 2,
						'wiki_API.list');
				setImmediate(function() {
					wiki_API.list(target, callback, options);
				});
			} else {
				library_namespace.debug('run callback after all list got.', 2,
						'wiki_API.list');
				callback(options.pages, target, options);
			}
		},
		// 引入 options，避免 get_list() 不能確實僅取指定 namespace。
		Object.assign({
			continue_session : options[KEY_SESSION],
			limit : options.limit || 'max'
		}, options));
	};

	wiki_API.list.default_type = 'embeddedin';

	// ------------------------------------------------------------------------

	// 未登錄/anonymous時的token
	var BLANK_TOKEN = '+\\';

	// get token
	// https://www.mediawiki.org/w/api.php?action=help&modules=query%2Btokens
	wiki_API.prototype.get_token = function(callback, type) {
		// assert: this (session) 已登入成功， callback 已設定好。
		if (!type) {
			// default_type: csrf (cross-site request forgery) token
			type = 'csrf';
		}
		// TODO: for {Array}type
		var session = this, token = session.token;
		if (!options.force && token[type + 'token']) {
			// 已存有此 token。
			callback(token[type + 'token']);
			return this;
		}

		library_namespace.debug('Try to get the ' + type + 'token ...', 1,
				'wiki_API.prototype.get_token');
		// console.log(this);
		wiki_API.query([ session.API_URL,
		// https://www.mediawiki.org/wiki/API:Tokens
		// 'query&meta=tokens&type=csrf|login|watch'
		'query&meta=tokens' + (type ? '&type=' + type : '') ],
		//
		function(data) {
			if (data && data.query && data.query.tokens) {
				// 設定 tokens。
				Object.assign(session.token, data.query.tokens);
				library_namespace.debug(
				//
				type + 'token: ' + session.token[type + 'token']
				//
				+ (session.token[type + 'token'] === BLANK_TOKEN
				//
				? ' (login as anonymous!)' : ''),
				//
				1, 'wiki_API.prototype.token');
				// console.log(this);
				callback(session.token[type + 'token'] || session.token);
				return;
			}

			library_namespace.error(
			//
			'wiki_API.prototype.token: Unknown response: ['
			//
			+ (data && data.warnings && data.warnings.tokens
			//
			&& data.warnings.tokens['*'] || data) + ']');
			if (library_namespace.is_debug()
			// .show_value() @ interact.DOM, application.debug
			&& library_namespace.show_value)
				library_namespace.show_value(data);
			callback();
		},
		// Tokens may not be obtained when using a callback
		Object.create(null), session);
		return this;
	};

	// 登入認證用。
	// https://www.mediawiki.org/wiki/API:Login
	// https://www.mediawiki.org/wiki/API:Edit
	// 認證用 cookie:
	// {zhwikiSession,centralauth_User,centralauth_Token,centralauth_Session,wikidatawikiSession,wikidatawikiUserID,wikidatawikiUserName}
	wiki_API.login = function(name, password, options) {
		function _next() {
			if (typeof callback === 'function') {
				callback(session.token.lgname);
			}
			library_namespace.debug('已登入 [' + session.token.lgname
					+ ']。自動執行 .next()，處理餘下的工作。', 1, 'wiki_API.login');
			// popup 'login'.
			session.actions.shift();
			session.next();
		}

		function _done(data) {
			// 注意: 在 mass edit 時會 lose token (badtoken)，需要保存 password。
			if (!session.preserve_password) {
				// 捨棄 password。
				delete session.token.lgpassword;
			}

			// console.log(JSON.stringify(data));
			if (data && data.warnings) {
				// console.log(JSON.stringify(data.warnings));
			}

			if (data && (data = data.login)) {
				if (data.result === 'Success') {
					wiki_API.login.copy_keys.forEach(function(key) {
						if (data[key]) {
							session.token[key] = data[key];
						}
					});

					delete session.login_failed_count;
					// 紀錄最後一次成功登入。
					// session.last_login = new Date;
				} else {
					// login error
					if (!(session.login_failed_count > 0)) {
						session.login_failed_count = 1;
					} else if (++session.login_failed_count > wiki_API.login.MAX_ERROR_RETRY) {
						// 連續登入失敗太多次就跳出程序。
						throw 'wiki_API.login: Login failed '
								+ session.login_failed_count + ' times! Exit!';
					}
					// delete session.last_login;

					/**
					 * 當沒有登入成功時的處理以及警訊。
					 * 
					 * e.g., data = <code>
					{"login":{"result":"Failed","reason":"Incorrect password entered.\nPlease try again."}}

					{"login":{"result":"Failed","reason":"You have made too many recent login attempts. Please wait 5 minutes before trying again."}}

					{"warnings":{"main":{"*":"Subscribe to the mediawiki-api-announce mailing list at <https://lists.wikimedia.org/mailman/listinfo/mediawiki-api-announce> for notice of API deprecations and breaking changes."},"login":{"*":"Main-account login via \"action=login\" is deprecated and may stop working without warning. To continue login with \"action=login\", see [[Special:BotPasswords]]. To safely continue using main-account login, see \"action=clientlogin\"."}},"login":{"result":"Success","lguserid":263674,"lgusername":"Cewbot"}}
					 * </code>
					 */
					library_namespace.error('wiki_API.login: login ['
							+ session.token.lgname + '] failed '
							+ session.login_failed_count + '/'
							+ wiki_API.login.MAX_ERROR_RETRY + ': ['
							+ data.result + '] ' + data.reason + ' ('
							+ session.API_URL + ')');
					if (data.result !== 'Failed' || data.result !== 'NeedToken') {
						// Unknown result
					}
				}
			}
			session.get_token(_next);
		}

		// 支援斷言編輯功能。
		var action = 'assert=user', callback, session, API_URL;
		if (library_namespace.is_Object(options)) {
			API_URL = options.API_URL;
			session = options[KEY_SESSION];
			callback = options.callback;
		} else {
			if (typeof options === 'function') {
				callback = options;
			} else if (typeof options === 'string') {
				// treat options as API_URL
				API_URL = options;
			}
			// 前置處理。
			options = Object.create(null);
		}

		if (!session) {
			// 初始化 session 與 agent。這裡 callback 當作 API_URL。
			session = new wiki_API(name, password, API_URL);
		}
		if (!name || !password) {
			library_namespace
					.warn('wiki_API.login: The user name or password is not provided. Abandon login attempt.');
			// console.trace('Stop login');
			return session;
		}

		// copy configurations
		if (options.preserve_password) {
			session.preserve_password = options.preserve_password;
		}

		if (!('login_mark' in options) || options.login_mark) {
			// hack: 這表示正 log in 中，當 login 後，會自動執行 .next()，處理餘下的工作。
			// @see wiki_API.prototype.next
			if (options.login_mark) {
				// 將 'login' 置於工作佇列最前頭。
				session.actions.unshift([ 'login' ]);
			} else {
				// default: 依順序將 'login' 置於最末端。
				session.actions.push([ 'login' ]);
			}
		}
		if (session.API_URL) {
			library_namespace.debug('API URL: [' + session.API_URL + ']。', 3,
					'wiki_API.login');
			action = [ session.API_URL, action ];
		}
		library_namespace.debug('action: [' + action + ']。', 3,
				'wiki_API.login');

		library_namespace.debug('準備登入 [' + name + ']。', 1, 'wiki_API.login');
		wiki_API.query(action, function(data) {
			// 確認尚未登入，才作登入動作。
			if (data === '' && !options.force) {
				// 您已登入。
				library_namespace.debug('You are already logged in.', 1,
						'wiki_API.login');
				_done();
				return;
			}

			// https://www.mediawiki.org/w/api.php?action=help&modules=login
			var token = Object.assign(Object.create(null), session.token);
			// .csrftoken 是本函式為 cache 加上的，非正規 parameter。
			delete token.csrftoken;
			wiki_API.query([ session.API_URL,
			// 'query&meta=tokens&type=login'
			'login' ], function(data) {
				if (data && data.login && data.login.result === 'NeedToken') {
					token.lgtoken = session.token.lgtoken = data.login.token;
					wiki_API.query([ session.API_URL, 'login' ], _done, token,
							session);
				} else {
					library_namespace.error(
					//		
					'wiki_API.login: 無法 login！ Abort! Response:');
					library_namespace.error(data);
				}
			}, token, session);
		}, null, session);

		return session;
	};

	/** {Natural}登入失敗時最多重新嘗試下載的次數。 */
	wiki_API.login.MAX_ERROR_RETRY = 8;

	/** {Array}欲 copy 至 session.token 之 keys。 */
	wiki_API.login.copy_keys = 'lguserid,lgtoken,cookieprefix,sessionid'
			.split(',');

	// ------------------------------------------------------------------------

	wiki_API.logout = function(session, callback) {
		var API_URL = typeof session === 'string' ? session
				: API_URL_of_options(session);
		wiki_API.query([ API_URL, 'logout' ], function(data) {
			// data: {}
			// console.log(data);
			delete session.token;
			if (typeof callback === 'function') {
				callback.call(session, data);
			}
		});
	};

	// ------------------------------------------------------------------------

	// https://www.mediawiki.org/w/api.php?action=help&modules=sitematrix
	// https://zh.wikipedia.org/w/api.php?action=help&modules=paraminfo

	// get_site_configurations
	// https://zh.wikipedia.org/w/api.php?action=help&modules=query%2Bsiteinfo
	// https://www.mediawiki.org/wiki/API:Siteinfo
	// https://zh.wikipedia.org/w/api.php?action=query&meta=siteinfo&siprop=general%7Cnamespaces%7Cnamespacealiases%7Cstatistics&utf8
	function siteinfo(options, callback) {
		// console.log([ options, callback ]);

		options = Object.assign({
			meta : 'siteinfo',
			// magicwords: #重定向 interwikimap, thumb %1px center,
			// https://zh.wikipedia.org/w/api.php?action=query&meta=siteinfo&siprop=general|namespaces|namespacealiases|specialpagealiases|magicwords|extensiontags|protocols&utf8&format=json
			siprop : 'general|namespaces|namespacealiases|specialpagealiases'
					+ '|magicwords|languagevariants|extensiontags|protocols'
		// + '|functionhooks|variables'
		}, options);

		var session;
		if ('session' in options) {
			session = options[KEY_SESSION];
			delete options[KEY_SESSION];
		}

		var action = 'action=' + 'query',
		//
		API_URL = session && session.API_URL;
		if (API_URL) {
			action = [ API_URL, action ];
		}

		wiki_API.query(action, function(response, error) {
			// console.log(JSON.stringify(response));
			error = error || response && response.error;
			if (error) {
				callback(response, error);
				return;
			}

			response = response.query;
			if (session) {
				adapt_site_configurations(session, response);
			}
			callback(response);
		}, options, session);
	}

	wiki_API.siteinfo = siteinfo;

	// TODO
	function adapt_site_configurations(session, configurations) {
		console.log(configurations);
		var site_configurations = session.configurations;
		if (site_configurations === default_site_configurations) {
			session.configurations = site_configurations
			//
			= Object.assign(Object.create(null),
			//
			default_site_configurations);
		}

		var general = configurations.general;
		if (general) {
			// site_configurations.general=general;
			'mainpage|sitename|linktrail|legaltitlechars|invalidusernamechars|case|lang|maxarticlesize|timezone|timeoffset|maxuploadsize'
					.split('|').forEach(function(name) {
						site_configurations[name] = general[name];
					});

			site_configurations.magiclinks = Object.keys(general.magiclinks);
			site_configurations.lang_fallback = general.fallback.map(function(
					lang) {
				return lang.code;
			});
		}

		var languagevariants = configurations.languagevariants;
		if (languagevariants && languagevariants.zh) {
			delete languagevariants.zh.zh;
			delete languagevariants.zh['zh-hans'];
			delete languagevariants.zh['zh-hant'];

			// language fallbacks
			site_configurations.lang_fallbacks = Object.create(null);
			for ( var lang_code in languagevariants.zh) {
				site_configurations.lang_fallbacks[lang_code] = languagevariants.zh[lang_code].fallbacks;
			}
		}

		var namespaces = configurations.namespaces;
	}

	// html to wikitext
	// https://zh.wikipedia.org/w/api.php?action=help&modules=flow-parsoid-utils

	// ------------------------------------------------------------------------

	/**
	 * check if need to stop / 檢查是否需要緊急停止作業 (Emergency shutoff-compliant).
	 * 
	 * 此功能之工作機制/原理：<br />
	 * 在 .edit() 編輯（機器人執行作業）之前，先檢查是否有人在緊急停止頁面留言要求停止作業。<br />
	 * 只要在緊急停止頁面有指定的章節標題、或任何章節，就當作有人留言要停止作業，並放棄編輯。
	 * 
	 * TODO:<br />
	 * https://www.mediawiki.org/w/api.php?action=query&meta=userinfo&uiprop=hasmsg
	 * 
	 * @param {Function}callback
	 *            回調函數。 callback({Boolean}need stop)
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * 
	 * @see https://www.mediawiki.org/wiki/Manual:Parameters_to_index.php#Edit_and_submit
	 *      https://www.mediawiki.org/wiki/Help:Magic_words#URL_encoded_page_names
	 *      https://www.mediawiki.org/wiki/Help:Links
	 *      https://zh.wikipedia.org/wiki/User:Cewbot/Stop
	 */
	wiki_API.check_stop = function(callback, options) {
		// 前置處理。
		if (!library_namespace.is_Object(options))
			if (typeof options === 'string') {
				options = {
					title : options
				};
			} else {
				options = Object.create(null);
			}

		/**
		 * 緊急停止作業將檢測之頁面標題。 check title:<br />
		 * 只檢查此緊急停止頁面。
		 * 
		 * @type {String}
		 */
		var title = options.title;
		if (typeof title === 'function') {
			title = title(options.token);
		}
		if (!title) {
			title = wiki_API.check_stop.title(options.token);
		}

		library_namespace.debug('檢查緊急停止頁面 ' + get_page_title_link(title), 1,
				'wiki_API.check_stop');

		var session = options[KEY_SESSION] || this;
		wiki_API.page([ session.API_URL, title ], function(page_data) {
			var content = get_page_content(page_data),
			// default: NOT stopped
			stopped = false, PATTERN;

			if (typeof options.checker === 'function') {
				// 以 options.checker 的回傳來設定是否stopped。
				stopped = options.checker(content);
				if (stopped) {
					library_namespace.warn(
					//
					'wiki_API.check_stop: 已設定停止編輯作業！');
				}
				content = null;

			} else {
				// 指定 pattern
				PATTERN = options.pattern
				// options.section: 指定的緊急停止章節標題, section title to check.
				/** {String}緊急停止作業將檢測之章節標題。 */
				|| options.section
				/**
				 * for == 停止作業: 20150503 機器人作業 == <code>
				 * (new RegExp('\n==(.*?)' + '20150503' + '\\s*==\n')).test('\n== 停止作業:20150503 ==\n') === true
				 * </code>
				 */
				&& new RegExp('\n==(.*?)' + options.section + '(.*?)==\n');
			}

			if (content) {
				if (!library_namespace.is_RegExp(PATTERN)) {
					// use default pattern
					PATTERN = wiki_API.check_stop.pattern;
				}
				library_namespace.debug(
				//
				'wiki_API.check_stop: 採用 pattern: ' + PATTERN);
				stopped = PATTERN.test(content, page_data);
				if (stopped) {
					library_namespace.warn('緊急停止頁面 '
							+ get_page_title_link(title) + ' 有留言要停止編輯作業！');
				}
			}

			callback(stopped);
		}, options);
	};

	/**
	 * default page title to check:<br />
	 * [[{{TALKSPACE}}:{{ROOTPAGENAME}}/Stop]]
	 * 
	 * @param {Object}token
	 *            login 資訊，包含“csrf”令牌/密鑰。
	 * 
	 * @returns {String}
	 */
	wiki_API.check_stop.title = function(token) {
		return 'User_talk:' + token.lgname + '/Stop';
	};

	/**
	 * default check pattern: 任何章節/段落 section<br />
	 * default: 只要在緊急停止頁面有任何章節，就當作有人留言要求 stop。
	 * 
	 * @type {RegExp}
	 */
	wiki_API.check_stop.pattern = /\n=([^\n]+)=\n/;

	// ------------------------------------------------------------------------

	/**
	 * 編輯頁面。一次處理一個標題。<br />
	 * 警告:除非 text 輸入 {Function}，否則此函數不會檢查頁面是否允許機器人帳戶訪問！此時需要另外含入檢查機制！
	 * 
	 * 2016/7/17 18:55:24<br />
	 * 當採用 section=new 時，minor=1 似乎無效？
	 * 
	 * @param {String|Array}title
	 *            page title 頁面標題。 {String}title or [ {String}API_URL,
	 *            {String}title or {Object}page_data ]
	 * @param {String|Function}text
	 *            page contents 頁面內容。 {String}text or {Function}text(page_data)
	 * @param {Object}token
	 *            login 資訊，包含“csrf”令牌/密鑰。
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * @param {Function}callback
	 *            回調函數。 callback(page_data, error, result)
	 * @param {String}timestamp
	 *            頁面時間戳記。 e.g., '2015-01-02T02:52:29Z'
	 */
	wiki_API.edit = function(title, text, token, options, callback, timestamp) {
		var is_undo = options && options.undo;
		if (is_undo) {
			// 一般 undo_count 超過1也不一定能成功？因此設定輸入 {undo:1} 時改 {undo:true} 亦可。
			if (is_undo === true) {
				options.undo = is_undo = 1;
			} else if (!(is_undo >= 1)) {
				delete options.undo;
			}
		}

		var undo_count = options
				&& (options.undo_count || is_undo
						&& (is_undo < wiki_API.edit.undo_count_limit && is_undo));

		if (undo_count || typeof text === 'function') {
			library_namespace.debug('先取得內容再 edit [' + get_page_title(title)
					+ ']。', 1, 'wiki_API.edit');
			// console.log(title);
			if (undo_count) {
				var _options = Object.clone(options);
				if (!_options.rvlimit) {
					_options.rvlimit = undo_count;
				}
				if (!_options.rvprop) {
					_options.rvprop =
					// user: 提供 user name 給 text() 用。
					typeof text === 'function' ? 'ids|timestamp|user'
					// 無須 content，盡量減少索求的資料量。
					: 'ids|timestamp';
				}
			}

			wiki_API.page(title, function(page_data) {
				if (options && (!options.ignore_denial && wiki_API.edit
				// TODO: 每經過固定時間，或者編輯特定次數之後，就再檢查一次。
				.denied(page_data, options.bot_id, options.notification))) {
					library_namespace.warn(
					// Permission denied
					'wiki_API.edit: Denied to edit ['
							+ get_page_title(page_data) + ']');
					callback(page_data, 'denied');

				} else {
					if (undo_count) {
						delete options.undo_count;
						// page_data =
						// {pageid:0,ns:0,title:'',revisions:[{revid:0,parentid:0,user:'',timestamp:''},...]}
						var revision = get_page_content.revision(page_data);
						if (revision) {
							timestamp = revision.timestamp;
							// 指定 rev_id 版本編號。
							options.undo = revision.revid;
						}
						options.undoafter = page_data.revisions
						// get the oldest revision
						[page_data.revisions.length - 1].parentid;
					}
					// 需要同時改變 wiki_API.prototype.next！
					wiki_API.edit(title,
					// 這裡不直接指定 text，是為了讓使(回傳要編輯資料的)設定值函數能即時依page_data變更 options。
					// undo_count ? '' :
					typeof text === 'function' &&
					// or: text(get_page_content(page_data),
					// page_data.title, page_data)
					// .call(options,): 使(回傳要編輯資料的)設定值函數能以this即時變更 options。
					// 注意: 更改此介面需同時修改 wiki_API.prototype.work 中 'edit' 之介面。
					text.call(options, page_data), token, options, callback,
							timestamp);
				}
			}, _options);
			return;
		}

		var action = !is_undo
				&& wiki_API.edit.check_data(text, title, options,
						'wiki_API.edit');
		if (action) {
			library_namespace.debug('直接執行 callback。', 2, 'wiki_API.edit');
			callback(title, action);
			return;
		}

		action = 'edit';
		// 處理 [ {String}API_URL, {String}title or {Object}page_data ]
		if (Array.isArray(title))
			action = [ title[0], action ], title = title[1];
		if (options && options.write_to) {
			// 設定寫入目標。一般為 debug、test 測試期間用。
			// e.g., write_to:'Wikipedia:沙盒',
			title = options.write_to;
			library_namespace.debug('依 options.write_to 寫入至 '
					+ get_page_title_link(title), 1, 'wiki_API.edit');
		}

		// 造出可 modify 的 options。
		if (options)
			library_namespace.debug('#1: ' + Object.keys(options).join(','), 4,
					'wiki_API.edit');
		if (is_undo) {
			options = library_namespace.setup_options(options);
		} else {
			options = Object.assign({
				text : text
			}, options);
		}
		if (library_namespace.is_Object(title)) {
			// 將 {Object}page_data 最新版本的 timestamp 標記註記到 options 去。
			wiki_API.edit.set_stamp(options, title);
			if (title.pageid)
				options.pageid = title.pageid;
			else
				options.title = title.title;
		} else {
			options.title = title;
		}
		if (timestamp) {
			// 若是 timestamp 並非最新版，則會放棄編輯。
			wiki_API.edit.set_stamp(options, timestamp);
		}
		// the token should be sent as the last parameter.
		options.token = library_namespace.is_Object(token) ? token.csrftoken
				: token;
		library_namespace.debug('#2: ' + Object.keys(options).join(','), 4,
				'wiki_API.edit');

		var session;
		if ('session' in options) {
			session = options[KEY_SESSION];
			delete options[KEY_SESSION];
		}

		wiki_API.query(action, function(data) {
			// console.log(data);
			var error = data.error
			// 檢查伺服器回應是否有錯誤資訊。
			? '[' + data.error.code + '] ' + data.error.info : data.edit
					&& data.edit.result !== 'Success'
					&& ('[' + data.edit.result + '] '
					// 新用戶要輸入過多或特定內容如 URL，可能遇到:<br />
					// [Failure] 必需輸入驗證碼
					+ (data.edit.info || data.edit.captcha && '必需輸入驗證碼'
					// 垃圾連結 [[MediaWiki:Abusefilter-warning-link-spam]]
					// e.g., youtu.be, bit.ly
					// @see 20170708.import_VOA.js
					|| data.edit.spamblacklist
							&& 'Contains spam link 包含被列入黑名單的連結: '
							+ data.edit.spamblacklist
					// || JSON.stringify(data.edit)
					));
			if (error) {
				/**
				 * <code>
				wiki_API.edit: Error to edit [User talk:Flow]: [no-direct-editing] Direct editing via API is not supported for content model flow-board used by User_talk:Flow
				wiki_API.edit: Error to edit [[Wikiversity:互助客栈/topic list]]: [tags-apply-not-allowed-one] The tag "Bot" is not allowed to be manually applied.
				[[Wikipedia:首页/明天]]是連鎖保護
				wiki_API.edit: Error to edit [[Wikipedia:典範條目/2019年1月9日]]: [cascadeprotected] This page has been protected from editing because it is transcluded in the following page, which is protected with the "cascading" option turned on: * [[:Wikipedia:首页/明天]]
				 * </code>
				 * 
				 * @see https://doc.wikimedia.org/mediawiki-core/master/php/ApiEditPage_8php_source.html
				 */
				if (data.error && data.error.code === 'no-direct-editing'
				// .section: 章節編號。 0 代表最上層章節，new 代表新章節。
				&& options.section === 'new') {
					// 無法以正常方式編輯，嘗試當作 Flow 討論頁面。
					edit_topic(title, options.sectiontitle,
					// [[mw:Flow]] 會自動簽名，因此去掉簽名部分。
					text.replace(/[\s\n\-]*~~~~[\s\n\-]*$/, ''), options.token,
							options, callback);
					return;
				}
				/**
				 * <s>遇到過長/超過限度的頁面 (e.g., 過多 transclusion。)，可能產生錯誤：<br />
				 * [editconflict] Edit conflict detected</s>
				 * 
				 * when edit:<br />
				 * [contenttoobig] The content you supplied exceeds the article
				 * size limit of 2048 kilobytes
				 * 
				 * 頁面大小系統上限 2,048 KB = 2 MB。
				 * 
				 * 須注意是否有其他競相編輯的 bots。
				 */
				library_namespace.warn('wiki_API.edit: Error to edit '
						+ get_page_title_link(title) + ': ' + error);
			} else if (data.edit && ('nochange' in data.edit)) {
				// 在極少的情況下，data.edit === undefined。
				library_namespace.info('wiki_API.edit: '
						+ get_page_title_link(title) + ': no change');
			}
			if (typeof callback === 'function') {
				// title.title === get_page_title(title)
				callback(title, error, data);
			}
		}, options, session);
	};

	/**
	 * 放棄編輯頁面用。<br />
	 * assert: true === !!wiki_API.edit.cancel
	 * 
	 * @type any
	 */
	wiki_API.edit.cancel = {
		cancel : '放棄編輯頁面用'
	};

	/** {Natural}小於此數則代表當作 undo 幾個版本。 */
	wiki_API.edit.undo_count_limit = 100;

	/**
	 * 對要編輯的資料作基本檢測。
	 * 
	 * @param data
	 *            要編輯的資料。
	 * @param title
	 *            title or id.
	 * @param {String}caller
	 *            caller to show.
	 * 
	 * @returns error: 非undefined表示((data))為有問題的資料。
	 */
	wiki_API.edit.check_data = function(data, title, options, caller) {
		var action;
		// 可以利用 ((return [ CeL.wiki.edit.cancel, 'reason' ];)) 來回傳 reason。
		// ((return [ CeL.wiki.edit.cancel, 'skip' ];)) 來跳過 (skip)，不特別顯示或處理。
		if (data === wiki_API.edit.cancel) {
			// 統一規範放棄編輯頁面訊息。
			data = [ wiki_API.edit.cancel ];
		}

		if (!data && (!options || !options.allow_empty)) {
			action = [ 'empty', gettext(typeof data === 'string'
			// 內容被清空
			? 'Content is empty' : 'Content is not settled') ];

		} else if (Array.isArray(data) && data[0] === wiki_API.edit.cancel) {
			action = data.slice(1);
			if (action.length === 1) {
				// error messages
				action[1] = action[0] || gettext('Abandon change');
			}
			if (!action[0]) {
				// error code
				action[0] = 'cancel';
			}

			library_namespace.debug('採用個別特殊訊息: ' + action, 2, caller
					|| 'wiki_API.edit.check_data');
		}

		if (action) {
			if (action[1] !== 'skip') {
				// 被 skip/pass 的話，連警告都不顯現，當作正常狀況。
				library_namespace.warn((caller || 'wiki_API.edit.check_data')
						+ ': ' + get_page_title_link(title) + ': '
						+ (action[1] || gettext('No reason provided')));
			} else {
				library_namespace.debug('Skip ' + get_page_title_link(title),
						2, caller || 'wiki_API.edit.check_data');
			}
			return action[0];
		}
	};

	/**
	 * 處理編輯衝突用。 to detect edit conflicts.
	 * 
	 * 注意: 會改變 options! Warning: will modify options！
	 * 
	 * 此功能之工作機制/原理：<br />
	 * 在 .page() 會取得每個頁面之 page_data.revisions[0].timestamp（各頁面不同）。於 .edit()
	 * 時將會以從 page_data 取得之 timestamp 作為時間戳記傳入呼叫，當 MediaWiki 系統 (API)
	 * 發現有新的時間戳記，會回傳編輯衝突，並放棄編輯此頁面。<br />
	 * 詳見 [https://github.com/kanasimi/CeJS/blob/master/application/net/wiki.js
	 * wiki_API.edit.set_stamp]。
	 * 
	 * @param {Object}options
	 *            附加參數/設定選擇性/特殊功能與選項
	 * @param {String}timestamp
	 *            頁面時間戳記。 e.g., '2015-01-02T02:52:29Z'
	 * 
	 * @returns {Object}options
	 * 
	 * @see https://www.mediawiki.org/wiki/API:Edit
	 */
	wiki_API.edit.set_stamp = function(options, timestamp) {
		if (get_page_content.is_page_data(timestamp)
		// 在 .page() 會取得 page_data.revisions[0].timestamp
		&& (timestamp = get_page_content.revision(timestamp)))
			// 自 page_data 取得 timestamp.
			timestamp = timestamp.timestamp;
		// timestamp = '2000-01-01T00:00:00Z';
		if (timestamp) {
			library_namespace.debug(timestamp, 3, 'wiki_API.edit.set_stamp');
			options.basetimestamp = options.starttimestamp = timestamp;
		}
		return options;
	};

	/**
	 * Get the contents of [[Template:Bots]].
	 * 
	 * @param {String}content
	 *            page contents 頁面內容。
	 * 
	 * @returns {Array}contents of [[Template:Bots]].
	 * 
	 * @see https://zh.wikipedia.org/wiki/Template:Bots
	 */
	wiki_API.edit.get_bot = function(content) {
		// TODO: use parse_template(content, 'bots')
		var bots = [], matched, PATTERN = /{{[\s\n]*bots[\s\n]*([\S][\s\S]*?)}}/ig;
		while (matched = PATTERN.exec(content)) {
			library_namespace.debug(matched.join('<br />'), 1,
					'wiki_API.edit.get_bot');
			if (matched = matched[1].trim().replace(/(^\|\s*|\s*\|$)/g, '')
			// .split('|')
			)
				bots.push(matched);
		}
		if (0 < bots.length) {
			library_namespace.debug(bots.join('<br />'), 1,
					'wiki_API.edit.get_bot');
			return bots;
		}
	};

	/**
	 * 測試頁面是否允許機器人帳戶訪問，遵守[[Template:Bots]]。機器人另須考慮{{Personal announcement}}的情況。
	 * 
	 * @param {String}content
	 *            page contents 頁面內容。
	 * @param {String}bot_id
	 *            機器人帳戶名稱。
	 * @param {String}notification
	 *            message notifications of action. 按通知種類而過濾(optout)。
	 * 
	 * @returns {Boolean|String}封鎖機器人帳戶訪問。
	 */
	wiki_API.edit.denied = function(content, bot_id, notification) {
		if (!content)
			return;
		var page_data;
		if (get_page_content.is_page_data(content)) {
			if (!(content = get_page_content(content)))
				return;
			page_data = content;
		}

		library_namespace.debug('contents to test: [' + content + ']', 3,
				'wiki_API.edit.denied');

		var bots = wiki_API.edit.get_bot(content),
		/** {String}denied messages */
		denied, allow_bot;

		if (bots) {
			library_namespace.debug('test ' + bot_id + '/' + notification, 3,
					'wiki_API.edit.denied');
			// botlist 以半形逗號作間隔。
			bot_id = (bot_id = bot_id && bot_id.toLowerCase()) ? new RegExp(
					'(?:^|[\\s,])(?:all|' + bot_id + ')(?:$|[\\s,])', 'i')
					: wiki_API.edit.denied.all;

			if (notification) {
				if (typeof notification === 'string'
				// optout 以半形逗號作間隔。
				&& notification.includes(','))
					notification = notification.split(',');
				if (Array.isArray(notification))
					notification = notification.join('|');
				if (typeof notification === 'string')
					// 預設必須包含 optout=all
					notification = new RegExp('(?:^|[\\s,])(?:all|'
							+ notification.toLowerCase() + ')(?:$|[\\s,])');
				else if (!library_namespace.is_RegExp(notification)) {
					library_namespace.warn(
					//
					'wiki_API.edit.denied: Invalid notification: ['
							+ notification + ']');
					notification = null;
				}
				// 自訂 {RegExp}notification 可能頗危險。
			}

			bots.some(function(data) {
				library_namespace.debug('test [' + data + ']', 1,
						'wiki_API.edit.denied');
				data = data.toLowerCase();

				var matched,
				/** {RegExp}封鎖機器人訪問之 pattern。 */
				PATTERN;

				// 過濾機器人所發出的通知/提醒
				// 頁面/用戶以bots模板封鎖通知
				if (notification) {
					PATTERN = /(?:^|\|)[\s\n]*optout[\s\n]*=[\s\n]*([^|]+)/ig;
					while (matched = PATTERN.exec(data)) {
						if (notification.test(matched[1])) {
							// 一被拒絕即跳出。
							return denied = 'Opt out of ' + matched[1];
						}
					}
				}

				// 檢查被拒絕之機器人帳戶名稱列表（以半形逗號作間隔）
				PATTERN = /(?:^|\|)[\s\n]*deny[\s\n]*=[\s\n]*([^|]+)/ig;
				while (matched = PATTERN.exec(data)) {
					if (bot_id.test(matched[1])) {
						// 一被拒絕即跳出。
						return denied = 'Banned: ' + matched[1];
					}
				}

				// 檢查被允許之機器人帳戶名稱列表（以半形逗號作間隔）
				PATTERN = /(?:^|\|)[\s\n]*allow[\s\n]*=[\s\n]*([^|]+)/ig;
				while (matched = PATTERN.exec(data)) {
					if (!bot_id.test(matched[1])) {
						// 一被拒絕即跳出。
						return denied = 'Not in allowed bots list: ['
								+ matched[1] + ']';
					}

					if (page_data)
						allow_bot = matched[1];
				}

			});
		}

		// {{Nobots}}判定
		if (!denied && /{{[\s\n]*nobots[\s\n]*}}/i.test(content))
			denied = 'Ban all compliant bots.';

		if (denied) {
			library_namespace.warn('wiki_API.edit.denied: ' + denied);
			return denied;
		}

		if (allow_bot) {
			// 特別標記本 bot 為被允許之 bot。
			page_data.allow_bot = allow_bot;
		}
	};

	/**
	 * pattern that will be denied.<br />
	 * i.e. "deny=all", !("allow=all")
	 * 
	 * @type {RegExp}
	 */
	wiki_API.edit.denied.all = /(?:^|[\s,])all(?:$|[\s,])/;

	// ------------------------------------------------------------------------

	// arguments: the same as .edit
	// file path/url
	wiki_API.upload = function(file_path, token, options, callback) {
		// https://commons.wikimedia.org/w/api.php?action=help&modules=upload
		// https://www.mediawiki.org/wiki/API:Upload
		var action, post_data = {
			text : undefined,
			// 備註
			comment : undefined,
			// must be set to reupload
			ignorewarnings : undefined,
			// 無此標籤的話可能會造成 [tags-apply-not-allowed-one]
			// The tag "..." is not allowed to be manually applied.
			tags : undefined,
			// 如果設置，服務器將臨時藏匿文件而不是加入存儲庫。
			stash : undefined,
			// 在可能的情況下讓潛在的大型檔案非同步處理。
			async : undefined,
			checkstatus : undefined,

			// Upload the file in pieces
			filesize : undefined,
			// leavemessage : undefined,
			// 只檢索指定文件密鑰的上傳狀態。
			chunk : undefined,
			offset : undefined,
			// Complete an earlier upload
			filekey : undefined,

			url : undefined,
			asyncdownload : undefined,
			// statuskey : undefined,

			filename : undefined
		};

		options = library_namespace.new_options(options);
		if (options.summary) {
			// 錯置?
			// options.comment = options.summary;
		}
		// TODO: check {{Information|permission=license}}
		for (action in post_data) {
			if (action in options) {
				post_data[action] = options[action];
			} else {
				delete post_data[action];
			}
		}
		post_data.token = token;
		if (library_namespace.is_Object(post_data.text)) {
			post_data.text = '== {{int:filedesc}} ==\n'
			// 將 .text 當作文件資訊。
			+ to_template_wikitext(post_data.text, {
				name : 'Information',
				separator : '\n|'
			});
		}

		var session;
		if ('session' in options) {
			session = options[KEY_SESSION];
			// delete options[KEY_SESSION];
		}

		// One of the parameters "filekey", "file" and "url" is required.
		if (false && file_path.includes('://')) {
			post_data.url = file_path;
			// The "filename" parameter must be set.
			if (!post_data.filename) {
				post_data.filename = file_path.match(/[\\\/]*$/)[0];
			}
			// Uploads by URL are not allowed from this domain.
		} else {
			// 自動先下載 fetch 再上傳。
			// file: 必須使用 multipart/form-data 以檔案上傳的方式傳送。
			if (!options.form_data) {
				// options.form_data 會被當作傳入 to_form_data() 之 options。
				options.form_data = true;
			}
			post_data.file = file_path.includes('://') ? {
				url : file_path
			} : {
				file : file_path
			};
		}

		if (!post_data.filename) {
			// file path → file name
			post_data.filename = file_path.match(/[^\\\/]*$/)[0]
			// {result:'Warning',warnings:{badfilename:''}}
			.replace(/#/g, '-');
			// https://www.mediawiki.org/wiki/Manual:$wgFileExtensions
		}

		if (session && session.API_URL && options.check_media) {
			// TODO: Skip exists file
			// @see 20181016.import_earthquake_shakemap.js
		}

		action = 'upload';
		if (session && session.API_URL) {
			action = [ session.API_URL, action ];
		}

		wiki_API.query(action, function(data, error) {
			if (error || !data || (error = data.error)
			/**
			 * <code>
			{upload:{result:'Warning',warnings:{exists:'file_name',nochange:{}},filekey:'',sessionkey:''}}
			{upload:{result:'Warning',warnings:{"duplicate":["file_name"]}}
			{upload:{result:'Warning',warnings:{"was-deleted":"file_name","duplicate-archive":"file_name"}}
			{upload:{result:'Success',filename:'',imageinfo:{}}}

			{"error":{"code":"fileexists-no-change","info":"The upload is an exact duplicate of the current version of [[:File:name.jpg]].","stasherrors":[{"message":"uploadstash-exception","params":["UploadStashBadPathException","Path doesn't exist."],"code":"uploadstash-exception","type":"error"}],"*":"See https://test.wikipedia.org/w/api.php for API usage. Subscribe to the mediawiki-api-announce mailing list at &lt;https://lists.wikimedia.org/mailman/listinfo/mediawiki-api-announce&gt; for notice of API deprecations and breaking changes."},"servedby":"mw1279"}
			</code>
			 */
			|| !(data = data.upload) || data.result !== 'Success') {
				// console.error(error);
				if (typeof callback === 'function')
					callback(data, error || data && data.result
							|| 'Error on uploading');
				return;
			}

			// console.log(data);
			typeof callback === 'function' && callback(data);
		}, post_data, options);
	};

	// ------------------------------------------------------------------------

	/**
	 * full text search<br />
	 * search wikitext: using prefix "insource:". e.g.,
	 * https://www.mediawiki.org/w/api.php?action=query&list=search&srwhat=text&srsearch=insource:abc+def
	 * 
	 * TODO: [[:en:Template:Regex]] "hastemplate:", "incategory:", "intitle:",
	 * "linksto:", "morelike:", "prefer-recent:", "boost-templates:",
	 * "namespace:"
	 * 
	 * @example <code>

	wiki.search(search_key, {
		summary : summary,
		log_to : log_to,
		each : function(page_data, messages, config) {
			console.log(page_data.title);
		}
	});

	 * </code>
	 * 
	 * @param {String}key
	 *            search key
	 * @param {Function}[callback]
	 *            回調函數。 callback({Array}pages, {Integer}totalhits,
	 *            {String}key_used)
	 * @param {Object}options
	 *            附加參數/設定選擇性/特殊功能與選項
	 * 
	 * @see https://www.mediawiki.org/w/api.php?action=help&modules=query%2Bsearch
	 *      https://www.mediawiki.org/wiki/API:Search_and_discovery
	 *      https://www.mediawiki.org/wiki/Help:CirrusSearch
	 */
	wiki_API.search = function(key, callback, options) {
		if (options > 0 || options === 'max') {
			options = {
				srlimit : options
			};
		}
		var API_URL;
		if (Array.isArray(key))
			API_URL = key[0], key = key[1];
		if (library_namespace.is_RegExp(key)) {
			// [[:en:Help:Searching/Regex]]
			// 有無 global flag 結果不同。
			key = ('insource:' + key).replace(/g([^\/]*)$/, '$1');
		}
		if (options.srnamespace) {
			options.srnamespace = get_namespace(options.srnamespace);
		}

		var _options;
		// 避免 session 也被帶入 parameters。
		if (KEY_SESSION in options) {
			_options = Object.clone(options);
			delete _options[KEY_SESSION];
		} else {
			_options = options;
		}
		wiki_API.query([ API_URL, 'query&list=search&'
		//
		+ get_URL.parameters_to_String(Object.assign({
			srsearch : key
		}, wiki_API.search.default_parameters, _options)) ], function(data,
				error) {
			if (library_namespace.is_debug(2)
			// .show_value() @ interact.DOM, application.debug
			&& library_namespace.show_value)
				library_namespace.show_value(data, 'wiki_API.search');

			options = data && (data['continue'] || data['query-continue']);
			var totalhits;
			if (data && (data = data.query)) {
				if (options)
					// data.search.sroffset = options.search.sroffset;
					Object.assign(data.search, options.search);
				totalhits = data.searchinfo.totalhits;
				data = data.search;
			}

			// data: [ page_data ].sroffset = next
			if (typeof callback === 'function') {
				// callback({Array}pages, {Integer}totalhits, {String}key_used)
				callback(data, totalhits, key);
			}
		}, null, options);
	};

	wiki_API.search.default_parameters = {
		// |portal
		srnamespace : get_namespace('module|template|category|main'),

		srprop : 'redirecttitle',
		// srlimit : 10,
		srlimit : 'max',
		// sroffset : 0,
		srinterwiki : 1
	};

	// ------------------------------------------------------------------------

	// TODO:
	// https://zh.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop&titles=Money|貨幣|數據|說明&redirects&format=json&utf8
	// https://zh.wikipedia.org/w/api.php?action=query&prop=redirects&rdprop&titles=Money|貨幣|數據|說明&redirects&format=json&utf8
	// https://zh.wikipedia.org/w/api.php?action=query&prop=redirects&rdprop=title&titles=Money|貨幣|數據|說明&redirects&format=json&utf8

	/**
	 * 取得所有重定向到(title重定向標的)之頁面列表。
	 * 
	 * 注意: 無法避免雙重重定向問題!
	 * 
	 * 工作機制:<br />
	 * 1. 先溯源: 若 [[title]] redirect 到 [[base]]，則將 base(title重定向標的) 設定成 base；<br />
	 * 否則將 base 設定成 title。<br />
	 * 2. 取得所有 redirect/重定向/重新導向 到 base 之 pages。<br />
	 * 3. 若設定 options.include_root，則(title重定向標的)將會排在[0]。
	 * 
	 * 因此若 R2 → R1 → R，且 R' → R，則 wiki_API.redirects(R2) 會得到 [{R1},{R2}]，
	 * wiki_API.redirects(R1) 與 wiki_API.redirects(R) 與 wiki_API.redirects(R')
	 * 皆會得到 [{R},{R1},{R'}]
	 * 
	 * 可以 [[Special:Whatlinkshere]] 確認。
	 * 
	 * @param {String}title
	 *            頁面名。
	 * @param {Function}callback
	 *            callback(root_page_data, redirect_list) { redirect_list = [
	 *            page_data, page_data, ... ]; }
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項. 此 options 可能會被變更！<br />
	 *            {Boolean}options.no_trace: 若頁面還重定向/重新導向到其他頁面則不溯源。溯源時 title 將以
	 *            root 替代。<br />
	 *            {Boolean}options.include_root 回傳 list 包含 title，而不只是所有 redirect
	 *            到 [[title]] 之 pages。
	 * 
	 * @see [[Special:DoubleRedirects]]
	 */
	wiki_API.redirects = function(title, callback, options) {
		// 正規化並提供可隨意改變的同內容參數，以避免修改或覆蓋附加參數。
		options = library_namespace.new_options(options);

		if (!options.no_trace) {
			// .original_title , .convert_from
			options.query_title = title;
			// 用 .page() 可省略 .converttitles
			// .redirects() 本身不會作繁簡轉換。
			// redirect_to: 追尋至重定向終點
			options.redirects = 1;
			options.prop = 'info';

			// 先溯源(追尋至重定向終點)
			wiki_API.page(title, function(page_data) {
				// console.log(page_data);
				// delete options.prop;
				options.page_data = page_data;

				// 已追尋至重定向終點，不再溯源。
				options.no_trace = true;
				wiki_API.redirects(
				// 已經轉換過，毋須 parse_redirect()。
				// parse_redirect(get_page_content(page_data)) ||

				// 若是 convert 過則採用新的 title。
				page_data.title || title, callback, options);
			}, options);
			return;
		}

		var action = normalize_title_parameter(title, options);
		if (!action) {
			throw 'wiki_API.redirects: Invalid title: '
					+ get_page_title_link(title);
		}

		action[1] = 'query&prop=redirects&rdlimit=max&' + action[1];
		if (!action[0])
			action = action[1];

		wiki_API.query(action, typeof callback === 'function'
		//
		&& function(data) {
			// copy from wiki_API.page()

			var error = data && data.error;
			// 檢查伺服器回應是否有錯誤資訊。
			if (error) {
				library_namespace.error(
				//
				'wiki_API.redirects: [' + error.code + '] ' + error.info);
				/**
				 * e.g., Too many values supplied for parameter 'pageids': the
				 * limit is 50
				 */
				if (data.warnings && data.warnings.query
				//
				&& data.warnings.query['*'])
					library_namespace.warn(data.warnings.query['*']);
				callback();
				return;
			}

			if (!data || !data.query || !data.query.pages) {
				library_namespace.warn(
				//
				'wiki_API.redirects: Unknown response: ['
				//
				+ (typeof data === 'object' && typeof JSON !== 'undefined'
				//
				? JSON.stringify(data) : data) + ']');
				if (library_namespace.is_debug()
				// .show_value() @ interact.DOM, application.debug
				&& library_namespace.show_value)
					library_namespace.show_value(data);
				callback();
				return;
			}

			data = data.query.pages;
			var pages = [];
			for ( var pageid in data) {
				var page = data[pageid];
				pages.push(page);
				// 僅處理第一頁。
				if ('missing' in page) {
					// 此頁面不存在/已刪除。Page does not exist. Deleted?
					library_namespace.warn(
					//
					'wiki_API.redirects: Not exists: '
					//
					+ (page.title ? get_page_title_link(page)
					//
					: ' id ' + page.pageid));
				}
				break;
			}

			pages = pages[0];
			if (get_page_content.is_page_data(options.page_data)
			//
			&& get_page_content.is_page_data(pages)
			//
			&& options.page_data.pageid === pages.pageid) {
				pages = Object.assign(options.page_data, pages);
			}

			// page 之 structure 將按照 wiki API 本身之 return！
			// page = {pageid,ns,title,redirects:[{},{}]}
			var redirect_list = pages.redirects || [];
			library_namespace.debug(
			//
			get_page_title(pages) + ': 有 ' + redirect_list.length
			//
			+ ' 個同名頁面(重定向至此頁面)。', 2, 'wiki_API.redirects');
			if (options.include_root) {
				// 避免修改或覆蓋 pages.redirects。
				redirect_list = redirect_list.slice();
				redirect_list.unshift(pages);
			}

			if (options.query_title)
				redirect_list.query_title = options.query_title;

			library_namespace.debug(
			//
			'redirects (alias) of ' + get_page_title_link(pages) + ': ('
			//
			+ redirect_list.length + ') [' + redirect_list.slice(0, 3)
			// CeL.wiki.title_of(page_data)
			.map(get_page_title) + ']...', 1, 'wiki_API.redirects');

			// callback(root_page_data 本名, redirect_list 別名 alias list)
			callback(pages, redirect_list);
		}, null, options);
	};

	/**
	 * 計算實質[[w:zh:Wikipedia:嵌入包含]](transclusion)之頁面數。
	 * 
	 * 若條目(頁面)[[w:zh:Wikipedia:嵌入包含]]有模板(頁面)別名，則將同時登記 embeddedin 於別名 alias 與
	 * root。<br />
	 * e.g., 當同時包含 {{Refimprove}}, {{RefImprove}} 時會算作兩個，但實質僅一個。<br />
	 * 惟計數時，此時應僅計算一次。本函數可以去除重複名稱，避免模板尚有名稱重複者。
	 * 
	 * @param {Object}root_name_hash
	 *            模板本名 hash. 模板本名[{String}模板別名/本名] = {String}root 模板本名
	 * @param {Array}embeddedin_list
	 *            頁面[[w:zh:Wikipedia:嵌入包含]]之模板 list。
	 * 
	 * @returns {ℕ⁰:Natural+0}normalized count
	 */
	wiki_API.redirects.count = function(root_name_hash, embeddedin_list) {
		if (!Array.isArray(embeddedin_list)) {
			library_namespace
					.warn('wiki_API.redirects.count: Invalid embeddedin list.');
			return 0;
		}
		var name_hash = Object.create(null);
		embeddedin_list.forEach(function(title) {
			title = get_page_title(title);
			library_namespace.debug('含有模板{{' + root_name_hash[title] + '}}←{{'
					+ title + '}}', 3, 'wiki_API.redirects.count');
			name_hash[root_name_hash[title] || title] = null;
		});
		return Object.keys(name_hash).length;
	};

	// ------------------------------------------------------------------------
	// administrator functions. 管理員相關函數。

	// 自 options 汲取出 parameters。
	// TODO: 整合進 normalize_parameters。
	// default_parameters[parameter name] = required
	function draw_parameters(options, default_parameters, token_type) {
		if (!options) {
			// Invalid options/parameters
			return 'No options specified';
		}

		// 汲取出 parameters。
		var parameters = Object.create(null);
		if (default_parameters) {
			for ( var parameter_name in default_parameters) {
				if (parameter_name in options) {
					parameters[parameter_name] = options[parameter_name];
				} else if (default_parameters[parameter_name]) {
					// 表示此屬性為必須存在/指定的屬性。
					// This parameter is required.
					return 'No property ' + parameter_name + ' specified';
				}

			}
		}

		var session = options[KEY_SESSION];

		// assert: 有parameters, e.g., {Object}parameters
		// 可能沒有 session

		// ----------------------------
		// 處理 target page。
		var KEY_ID = 'pageid', KEY_TITLE = 'title';
		if (parameters.to) {
			// move_to
			KEY_ID = 'fromid';
			KEY_TITLE = 'from';
		}

		// 都先從 options 取值，再從 session 取值。
		if (options[KEY_ID] >= 0 || options.pageid >= 0) {
			parameters[KEY_ID] = options[KEY_ID] >= 0 ? options[KEY_ID]
					: options.pageid;
		} else if (options[KEY_TITLE] || options.title) {
			parameters[KEY_TITLE] = options[KEY_TITLE] || options.title;
		} else if (get_page_content.is_page_data(session && session.last_page)) {
			// options.page_data
			if (session.last_page.pageid >= 0)
				parameters[KEY_ID] = session.last_page.pageid;
			else
				parameters[KEY_TITLE] = session.last_page.title;
		} else {
			// 可能沒有 page_data
			if (library_namespace.is_debug()) {
				library_namespace.error('draw_parameters: No page specified: '
						+ JSON.stringify(options));
			}
			return 'No page id/title specified';
		}

		// ----------------------------
		// 處理 token。
		if (!token_type) {
			token_type = 'csrf';
		}
		var token = options.token || session && session.token;
		if (token && typeof token === 'object') {
			// session.token.csrftoken
			token = token[token_type + 'token'];
		}
		if (!token) {
			// TODO: use session
			if (false) {
				library_namespace
						.error('wiki_API.protect: No token specified: '
								+ options);
			}
			return 'No ' + token_type + 'token specified';
		}
		parameters.token = token;

		return parameters;
	}

	// use "csrf" token retrieved from action=query&meta=tokens
	// callback(response, error);
	function wiki_operator(action, default_parameters, options, callback) {
		// default_parameters
		// Warning: 除 pageid/title/token 之外，這邊只要是能指定給 API 的，皆必須列入！
		var parameters = draw_parameters(options, default_parameters);
		// console.log(parameters);
		if (!library_namespace.is_Object(parameters)) {
			// error occurred.
			if (typeof callback === 'function')
				callback(undefined, parameters);
			return;
		}

		var session = options[KEY_SESSION];
		// TODO: 若是頁面不存在/已刪除，那就直接跳出。

		if (action === 'move') {
			library_namespace.is_debug((parameters.fromid || parameters.from)
					+ ' → ' + parameters.to, 1, 'wiki_operator.move');
		}

		var _action = 'action=' + action;
		var API_URL = session && session.API_URL;
		if (API_URL) {
			_action = [ API_URL, action ];
		}

		wiki_API.query(_action, function(response, error) {
			// console.log(JSON.stringify(response));
			error = error || response && response.error;
			if (error) {
				callback(response, error);
			} else {
				callback(response[action]);
			}
		}, parameters, session);
	}

	// ----------------------------------------------------

	// wiki_API.delete(): remove / delete a page.
	wiki_API['delete'] = function(options, callback) {
		// https://www.mediawiki.org/w/api.php?action=help&modules=delete

		/**
		 * response: <code>
		{"delete":{"title":"Title","reason":"content was: \"...\", and the only contributor was \"[[Special:Contributions/Cewbot|Cewbot]]\" ([[User talk:Cewbot|talk]])","logid":0000}}
		{"error":{"code":"nosuchpageid","info":"There is no page with ID 0.","*":"See https://test.wikipedia.org/w/api.php for API usage. Subscribe to the mediawiki-api-announce mailing list at &lt;https://lists.wikimedia.org/mailman/listinfo/mediawiki-api-announce&gt; for notice of API deprecations and breaking changes."},"servedby":"mw1232"}
		 * </code>
		 */

		wiki_operator('delete', {
			reason : false,
			tags : false,
			watchlist : false,
			oldimage : false
		}, options, callback);
	};

	// ----------------------------------------------------

	// wiki_API.move_to(): move a page from `from` to target `to`.
	wiki_API.move_to = function(options, callback) {
		// https://www.mediawiki.org/w/api.php?action=help&modules=move
		var default_parameters = {
			to : true,
			reason : false,
			movetalk : false,
			movesubpages : false,
			noredirect : false,
			watchlist : false,
			ignorewarnings : false,
			tags : false
		};

		/**
		 * response: <code>
		{"error":{"code":"nosuchpageid","info":"There is no page with ID 0.","*":"See https://zh.wikipedia.org/w/api.php for API usage. Subscribe to the mediawiki-api-announce mailing list at &lt;https://lists.wikimedia.org/mailman/listinfo/mediawiki-api-announce&gt; for notice of API deprecations and breaking changes."},"servedby":"mw1277"}
		error:
		{"code":"articleexists","info":"A page of that name already exists, or the name you have chosen is not valid. Please choose another name.","*":"See https://zh.wikipedia.org/w/api.php for API usage. Subscribe to the mediawiki-api-announce mailing list at &lt;https://lists.wikimedia.org/mailman/listinfo/mediawiki-api-announce&gt; for notice of API deprecations and breaking changes."}
		{"code":"selfmove","info":"The title is the same; cannot move a page over itself.","*":"See https://zh.wikipedia.org/w/api.php for API usage. Subscribe to the mediawiki-api-announce mailing list at &lt;https://lists.wikimedia.org/mailman/listinfo/mediawiki-api-announce&gt; for notice of API deprecations and breaking changes."}
		 * </code>
		 */

		// console.log(options);
		wiki_operator('move', default_parameters, options, callback);
	};

	// ----------------------------------------------------

	// @see wiki_API.is_protected
	// Change the protection level of a page.
	wiki_API.protect = function(options, callback) {
		// https://www.mediawiki.org/w/api.php?action=help&modules=protect

		/**
		 * response: <code>
		{"protect":{"title":"title","reason":"存檔保護作業","protections":[{"edit":"sysop","expiry":"infinite"},{"move":"sysop","expiry":"infinite"}]}}
		{"servedby":"mw1203","error":{"code":"nosuchpageid","info":"There is no page with ID 2006","*":"See https://zh.wikinews.org/w/api.php for API usage"}}
		 * </code>
		 */

		wiki_operator('protect', {
			// protections: e.g., 'edit=sysop|move=sysop', 一般說來edit應與move同步。
			protections : true,
			// 在正式場合，最好給個好的理由。
			// reason: @see [[MediaWiki:Protect-dropdown]]
			reason : false,
			// expiry : 'infinite',
			expiry : false,
			tags : false,
			cascade : false,
			watchlist : false
		}, Object.assign({
			protections : 'edit=sysop|move=sysop'
		}, options), callback);
	};

	// ----------------------------------------------------

	// rollback 僅能快速撤銷/回退/還原某一頁面最新版本之作者(最後一位使用者)一系列所有編輯至另一作者的編輯
	// The rollback revision will be marked as minor.
	wiki_API.rollback = function(options, callback) {
		var session = options[KEY_SESSION];

		if (session && !session.token.rollbacktoken) {
			session.get_token(function() {
				wiki_API.rollback(options, callback);
			}, 'rollback');
		}

		var parameters = draw_parameters(options, {
			// default_parameters
			// Warning: 除外pageid/title/token這邊只要是能指定給 API 的，皆必須列入！
			user : false,
			summary : false,
			markbot : false,
			tags : false
		}, 'rollback');
		if (!library_namespace.is_Object(parameters)) {
			// error occurred.
			if (typeof callback === 'function')
				callback(undefined, parameters);
			return;
		}

		// 都先從 options 取值，再從 session 取值。
		var page_data =
		// options.page_data ||
		options.pageid && options || session && session.last_page;

		// assert: 有parameters, e.g., {Object}parameters
		// 可能沒有 session, page_data

		if (!parameters.user && get_page_content.revision(page_data)) {
			// 將最後一個版本的編輯者當作回退對象。
			parameters.user = get_page_content.revision(page_data).user;
		}

		// https://www.mediawiki.org/w/api.php?action=help&modules=rollback
		// If the last user who edited the page made multiple edits in a row,
		// they will all be rolled back.
		if (!parameters.user) {
			// 抓最後的編輯者試試。
			// 要用pageid的話，得採page_data，就必須保證兩者相同。
			if (!parameters.title && page_data
					&& parameters.pageid !== page_data.pageid) {
				callback(undefined, 'parameters.pageid !== page_data.pageid');
				return;
			}
			wiki_API.page(page_data || parameters.title, function(page_data,
					error) {
				if (error || !get_page_content.revision(page_data)
				// 保證不會再持續執行。
				|| !get_page_content.revision(page_data).user) {
					if (false) {
						library_namespace.error(
						//
						'wiki_API.rollback: No user name specified!');
					}

					callback(undefined,
					//
					'No user name specified and I can not guess it!');
					return;
				}
				wiki_API.rollback(options, callback);
			}, Object.assign({
				rvprop : 'ids|timestamp|user'
			}, options));
			return;
		}

		if (!('markbot' in parameters) && options.bot) {
			parameters.markbot = options.bot;
		}

		var action = 'action=rollback';
		if (session && session.API_URL) {
			action = [ session.API_URL, action ];
		}

		/**
		 * response: <code>
		{"rollback":{"title":"title","pageid":1,"summary":"","revid":9,"old_revid":7,"last_revid":1,"messageHtml":"<p></p>"}}
		{"servedby":"mw1190","error":{"code":"badtoken","info":"Invalid token","*":"See https://zh.wikinews.org/w/api.php for API usage"}}
		 * </code>
		 */
		wiki_API.query(action, function(response) {
			var error = response && response.error;
			if (error) {
				callback(response, error);
			} else {
				// revid 回滾的版本ID。
				// old_revid 被回滾的第一個（最新）修訂的修訂ID。
				// last_revid 被回滾最後一個（最舊）版本的修訂ID。
				// 如果回滾不會改變的頁面，沒有新修訂而成。在這種情況下，revid將等於old_revid。
				callback(response.rollback);
			}
		}, parameters, session);
	};

	// ----------------------------------------------------

	// 目前的修訂，不可隱藏。
	// This is the current revision. It cannot be hidden.
	wiki_API.hide = function(options, callback) {
		TODO;
	};

	// ========================================================================

	/** {String}default language / wiki name */
	var default_language;

	// Wikimedia project code alias
	// https://github.com/wikimedia/mediawiki/blob/master/languages/LanguageCode.php
	// language_code_to_site_alias[language code] = project code
	// @see function language_to_site_name(language, project)
	// @see [[en:Wikimedia_project#Project_codes]]
	var language_code_to_site_alias = {
		// als : 'sq',
		'be-tarask' : 'be-x-old',
		// cmn : 'zh',
		// gsw : 'als',
		// hbs : 'sh',
		lzh : 'zh-classical',
		nan : 'zh-min-nan',
		// nb : 'no',
		rup : 'roa-rup',
		sgs : 'bat-smg',
		vro : 'fiu-vro',
		// 為粵文維基百科特別處理。
		yue : 'zh-yue',

		// 為日文特別修正: 'jp' is wrong!
		jp : 'ja'
	},
	// 客製化的設定。
	// wikidata_site_alias[site code] = Wikidata site code
	// @see https://www.wikidata.org/w/api.php?action=help&modules=wbeditentity
	// for sites
	wikidata_site_alias = {
		// 為粵文維基百科特別處理。
		yuewiki : 'zh_yuewiki',

		// 為日文特別修正: 'jp' is wrong!
		jpwiki : 'jawiki'
	},
	// @see function set_default_language(language)
	valid_language = 'nds-nl|map-bms'.split('|').to_hash();

	Object.entries(language_code_to_site_alias).forEach(function(pair) {
		if (pair[0].includes('-'))
			valid_language[pair[0]] = true;
		if (pair[1].includes('-'))
			valid_language[pair[1]] = true;
	});

	/**
	 * Set default language. 改變預設之語言。
	 * 
	 * @example <code>
	CeL.wiki.set_language('en');
	 * </code>
	 * 
	 * @param {String}[language]
	 *            language.<br />
	 *            e.g., 'en'.
	 * 
	 * @returns {String}預設之語言。
	 * 
	 * @see setup_API_language()
	 */
	function set_default_language(language) {
		if (typeof language !== 'string'
				|| !PATTERN_PROJECT_CODE_i.test(language)) {
			if (language)
				library_namespace.warn(
				//
				'set_default_language: Invalid language: [' + language
						+ ']. e.g., "en".');
			return default_language;
		}

		// assert: default_language is in lower case. See URL_to_wiki_link().
		default_language = language.toLowerCase();
		// default api URL. Use <code>CeL.wiki.API_URL = api_URL('en')</code> to
		// change it.
		// see also: application.locale
		wiki_API.API_URL = library_namespace.is_WWW()
				&& (navigator.userLanguage || navigator.language)
				|| default_language;
		if (!(wiki_API.API_URL in valid_language)) {
			// 'en-US' → 'en'
			wiki_API.API_URL = wiki_API.API_URL.toLowerCase().replace(/-.+$/,
					'');
		}
		wiki_API.API_URL = api_URL(wiki_API.API_URL);
		library_namespace.debug('wiki_API.API_URL = ' + wiki_API.API_URL, 3,
				'set_default_language');

		if (SQL_config) {
			SQL_config.set_language(default_language);
		}

		wiki_API.prototype.continue_key = gettext(default_continue_key);

		return wiki_API.language = default_language;
	}

	// 設定預設之語言。 English
	set_default_language('en');

	// [[:en:right-to-left#RTL Wikipedia languages]]
	// 找出使用了由右至左的文字，可用於{{lang}}模板。
	// 應該改用{{tl|rtl-lang}}處理右至左文字如阿拉伯語及希伯來語，請參見{{tl|lang}}的說明。
	// [ all ]
	var LTR_SCRIPTS = 'ar[cz]?|he|fa|bcc|bqi|ckb|dv|glk|kk|lrc|mzn|pnb|ps|sd|u[gr]|yi|tg-Arab',
	// CeL.wiki.PATTERN_LTR.test('ar')===true
	PATTERN_LTR = new RegExp('^(?:' + LTR_SCRIPTS + ')$');

	// ------------------------------------------------------------------------

	/** {Object|Function}fs in node.js */
	var node_fs;
	try {
		if (library_namespace.platform.nodejs)
			// @see https://nodejs.org/api/fs.html
			node_fs = require('fs');
		if (typeof node_fs.readFile !== 'function')
			throw true;
	} catch (e) {
		// enumerate for wiki_API.cache
		// 模擬 node.js 之 fs，以達成最起碼的效果（即無 cache 功能的情況）。
		library_namespace.warn(this.id
				+ ': 無 node.js 之 fs，因此不具備 cache 或 SQL 功能。');
		node_fs = {
			readFile : function(file_path, options, callback) {
				library_namespace.error('Can not read file ' + file_path);
				if (typeof callback === 'function')
					callback(true);
			},
			writeFile : function(file_path, data, options, callback) {
				library_namespace.error('Can not write to file ' + file_path);
				if (typeof options === 'function' && !callback)
					callback = options;
				if (typeof callback === 'function')
					callback(true);
			}
		};
	}

	// ------------------------------------------------------------------------
	// SQL 相關函數。

	var
	// http://stackoverflow.com/questions/9080085/node-js-find-home-directory-in-platform-agnostic-way
	// Windows: process.platform.toLowerCase().startsWith('win')
	/** {String}user home directory */
	home_directory = library_namespace.platform.nodejs
			&& (process.env.HOME || process.env.USERPROFILE),
	/** {String}Wikimedia Toolforge database host */
	TOOLSDB = 'tools-db',
	/** {String}user/bot name */
	user_name,
	/** {String}Wikimedia Toolforge name. CeL.wiki.wmflabs */
	wmflabs,
	/** {Object}Wikimedia Toolforge job data. CeL.wiki.job_data */
	job_data,
	/** node mysql handler */
	node_mysql,
	/** {Object}default SQL configurations */
	SQL_config;

	if (home_directory
			&& (home_directory = home_directory.replace(/[\\\/]$/, '').trim())) {
		user_name = home_directory.match(/[^\\\/]+$/);
		user_name = user_name ? user_name[0] : undefined;
		if (user_name) {
			wiki_API.user_name = user_name;
		}
		home_directory += library_namespace.env.path_separator;
	}

	// setup SQL config language (and database/host).
	function set_SQL_config_language(language) {
		if (!language) {
			return;
		}
		if (typeof language !== 'string') {
			library_namespace.error(
			//
			'set_SQL_config_language: Invalid language: [' + language + ']');
			return;
		}

		// 正規化。
		language = language.trim().toLowerCase();
		// TODO: 'zh.news'
		// 警告: this.language 可能包含 'zhwikinews' 之類。
		this.language = language
		// 'zhwiki' → 'zh'
		.replace(/wik[it][a-z]{0,9}$/, '')
		// 'zh-classical' → 'zh_classical'
		.replace(/-/g, '_');

		if (language === 'meta') {
			// @see /usr/bin/sql
			this.host = 's7.labsdb';
			// https://wikitech.wikimedia.org/wiki/Nova_Resource:Tools/Help#Metadata_database
			this.database = 'meta_p';

		} else if (language === TOOLSDB) {
			this.host = language;
			// delete this.database;

		} else if (is_wikidata_site(language)) {
			this.host = language + '.labsdb';
			/**
			 * The database names themselves consist of the mediawiki project
			 * name, suffixed with _p
			 * 
			 * @see https://wikitech.wikimedia.org/wiki/Help:Toolforge/Database
			 */
			this.database = language + '_p';
		} else {
			// e.g., 'zh', 'zh_classical'
			this.host = language + 'wiki.labsdb';
			this.database = language + 'wiki_p';
		}
		// console.log(this);
	}

	/**
	 * return new SQL config
	 * 
	 * @param {String}[language]
	 *            database language.<br />
	 *            e.g., 'en', 'commons', 'wikidata', 'meta'.
	 * @param {String}[user]
	 *            SQL database user name
	 * @param {String}[password]
	 *            SQL database user password
	 * 
	 * @returns {Object}SQL config
	 */
	function new_SQL_config(language, user, password) {
		var config, is_clone;
		if (user) {
			config = {
				user : user,
				password : password,
				db_prefix : user + '__',
				set_language : set_SQL_config_language
			};
		} else if (SQL_config) {
			is_clone = true;
			config = Object.clone(SQL_config);
		} else {
			config = {};
		}

		if (typeof language === 'object') {
			if (is_clone) {
				delete config.database;
			}
			if (language.API_URL) {
				// treat language as session.
				// use set_SQL_config_language()
				config.set_language(language_to_site_name(language), !user);
			} else {
				Object.assign(config, language);
			}
		} else if (typeof language === 'string' && language) {
			if (is_clone) {
				delete config.database;
			}
			// change language (and database/host).
			config.set_language(language, !user);
		}

		return config;
	}

	/**
	 * 讀取並解析出 SQL 設定。
	 * 
	 * @param {String}file_name
	 *            file name
	 * 
	 * @returns {Object}SQL config
	 */
	function parse_SQL_config(file_name) {
		var config;
		try {
			config = library_namespace.get_file(file_name);
		} catch (e) {
			library_namespace.error(
			//
			'parse_SQL_config: Can not read config file [ ' + file_name + ']!');
			return;
		}

		// 應該用 parser。
		var user = config.match(/\n\s*user\s*=\s*([^\s]+)/), password;
		if (!user || !(password = config.match(/\n\s*password\s*=\s*([^\s]+)/)))
			return;

		return new_SQL_config(default_language, user[1], password[1]);
	}

	// only for node.js.
	// https://wikitech.wikimedia.org/wiki/Help:Toolforge/FAQ#How_can_I_detect_if_I.27m_running_in_Cloud_VPS.3F_And_which_project_.28tools_or_toolsbeta.29.3F
	if (library_namespace.platform.nodejs) {
		/** {String}Wikimedia Toolforge name. CeL.wiki.wmflabs */
		wmflabs = node_fs.existsSync('/etc/wmflabs-project')
		// e.g., 'tools-bastion-05'.
		// if use ((process.env.INSTANCEPROJECT)), you may get 'tools' or
		// 'tools-login'.
		&& (process.env.INSTANCENAME
		// 以 /usr/bin/jsub 執行時可得。
		// e.g., 'tools-exec-1210.eqiad.wmflabs'
		|| process.env.HOSTNAME || true);
	}

	if (wmflabs) {
		// CeL.wiki.wmflabs
		wiki_API.wmflabs = wmflabs;

		// default: use Wikimedia Varnish Cache.
		// wiki_API.use_Varnish = true;
		// 2016/4/9 9:9:7 預設不使用 Wikimedia Varnish Cache。速度較慢，但較有保障。
		// delete CeL.wiki.use_Varnish;

		try {
			if (node_mysql = require('mysql')) {
				SQL_config = parse_SQL_config(home_directory
				// The production replicas.
				// https://wikitech.wikimedia.org/wiki/Help:Toolforge#The_databases
				// https://wikitech.wikimedia.org/wiki/Help:Toolforge/Database
				// Wikimedia Toolforge
				// 上之資料庫僅為正式上線版之刪節副本。資料並非最新版本(但誤差多於數分內)，也不完全，
				// <s>甚至可能為其他 users 竄改過</s>。
				+ 'replica.my.cnf');
			}
		} catch (e) {
			// TODO: handle exception
		}

		if (process.env.JOB_ID && process.env.JOB_NAME) {
			// assert: process.env.ENVIRONMENT === 'BATCH'
			wiki_API.job_data = job_data = {
				id : process.env.JOB_ID,
				name : process.env.JOB_NAME,
				request : process.env.REQUEST,
				script : process.env.JOB_SCRIPT,
				stdout_file : process.env.SGE_STDOUT_PATH,
				stderr_file : process.env.SGE_STDERR_PATH,
				// 'continuous' or 'task'
				is_task : process.env.QUEUE === 'task'
			};
		}
	}

	// ------------------------------------------------------------------------

	/**
	 * execute SQL command.
	 * 
	 * @param {String}SQL
	 *            SQL command.
	 * @param {Function}callback
	 *            回調函數。 callback({Object}error, {Array}rows, {Array}fields)
	 * @param {Object}[config]
	 *            configuration.
	 * 
	 * @see https://wikitech.wikimedia.org/wiki/Help:Toolforge/Database
	 * 
	 * @require https://github.com/mysqljs/mysql<br />
	 *          TODO: https://github.com/sidorares/node-mysql2
	 */
	function run_SQL(SQL, callback, config) {
		function _callback(error, results, fields) {
			// the connection will return to the pool, ready to be used again by
			// someone else.
			// connection.release();

			// close the connection and remove it from the pool
			// connection.destroy();

			callback(error, results, fields);
		}

		// TypeError: Converting circular structure to JSON
		// library_namespace.debug(JSON.stringify(config), 3, 'run_SQL');
		if (!config && !(config = SQL_config)) {
			return;
		}

		// treat config as language.
		if (typeof config === 'string' || is_wiki_API(config)) {
			config = new_SQL_config(config);
		}

		library_namespace.debug(String(SQL), 3, 'run_SQL');
		// console.log(JSON.stringify(config));
		var connection = node_mysql.createConnection(config);
		connection.connect();
		if (Array.isArray(SQL)) {
			// ("SQL", [values], callback)
			connection.query(SQL[0], SQL[1], _callback);
		} else {
			// ("SQL", callback)
			connection.query(SQL, _callback);
		}
		connection.end();
	}

	if (false) {
		CeL.wiki.SQL('SELECT * FROM `revision` LIMIT 3000,1;',
		//
		function(error, rows, fields) {
			if (error)
				throw error;
			// console.log('The result is:');
			console.log(rows);
		});
	}

	// ------------------------------------------------------------------------

	/**
	 * Create a new user database.
	 * 
	 * @param {String}dbname
	 *            database name.
	 * @param {Function}callback
	 *            回調函數。
	 * @param {String}[language]
	 *            database language.<br />
	 *            e.g., 'en', 'commons', 'wikidata', 'meta'.
	 * 
	 * @see https://wikitech.wikimedia.org/wiki/Help:Tool_Labs/Database#Creating_new_databases
	 */
	function create_database(dbname, callback, language) {
		if (!SQL_config)
			return;

		var config;
		if (typeof dbname === 'object') {
			config = Object.clone(dbname);
			dbname = config.database;
			delete config.database;
		} else {
			config = new_SQL_config(language || TOOLSDB);
			if (!language) {
				delete config.database;
			}
		}

		library_namespace.log('create_database: Try to create database ['
				+ dbname + ']');
		if (false) {
			/**
			 * 用此方法會:<br />
			 * [Error: ER_PARSE_ERROR: You have an error in your SQL syntax;
			 * check the manual that corresponds to your MariaDB server version
			 * for the right syntax to use near ''user__db'' at line 1]
			 */
			var SQL = {
				// placeholder 佔位符
				// 避免 error.code === 'ER_DB_CREATE_EXISTS'
				sql : 'CREATE DATABASE IF NOT EXISTS ?',
				values : [ dbname ]
			};
		}

		if (dbname.includes('`'))
			throw new Error('Invalid database name: [' + dbname + ']');

		run_SQL('CREATE DATABASE IF NOT EXISTS `' + dbname + '`', function(
				error, rows, fields) {
			if (typeof callback !== 'function')
				return;
			if (error)
				callback(error);
			else
				callback(null, rows, fields);
		}, config);

		return config;
	}

	// ------------------------------------------------------------------------

	/**
	 * SQL 查詢功能之前端。
	 * 
	 * @example <code>

	// change language (and database/host).
	//CeL.wiki.SQL.config.set_language('en');
	CeL.wiki.SQL(SQL, function callback(error, rows, fields) { if(error) console.error(error); else console.log(rows); }, 'en');

	// get sitelink count of wikidata items
	// https://www.mediawiki.org/wiki/Wikibase/Schema/wb_items_per_site
	// https://www.wikidata.org/w/api.php?action=help&modules=wbsetsitelink
	var SQL_get_sitelink_count = 'SELECT ips_item_id, COUNT(*) AS `link_count` FROM wb_items_per_site GROUP BY ips_item_id LIMIT 10';
	var SQL_session = new CeL.wiki.SQL(function(error){}, 'wikidata');
	function callback(error, rows, fields) { if(error) console.error(error); else console.log(rows); SQL_session.connection.destroy(); }
	SQL_session.SQL(SQL_get_sitelink_count, callback);

	// one-time method
	CeL.wiki.SQL(SQL_get_sitelink_count, callback, 'wikidata');

	 * </code>
	 * 
	 * @example <code>

	// 進入 default host (TOOLSDB)。
	var SQL_session = new CeL.wiki.SQL(()=>{});
	// 進入 default host (TOOLSDB)，並預先創建 user's database 'dbname' (e.g., 's00000__dbname')
	var SQL_session = new CeL.wiki.SQL('dbname', ()=>{});
	// 進入 zhwiki.zhwiki_p。
	var SQL_session = new CeL.wiki.SQL(()=>{}, 'zh');
	// 進入 zhwiki.zhwiki_p，並預先創建 user's database 'dbname' (e.g., 's00000__dbname')
	var SQL_session = new CeL.wiki.SQL('dbname', ()=>{}, 'zh');

	// create {SQL_session}instance
	new CeL.wiki.SQL('mydb', function callback(error, rows, fields) { if(error) console.error(error); } )
	// run SQL query
	.SQL(SQL, function callback(error, rows, fields) { if(error) console.error(error); } );

	SQL_session.connection.destroy();

	 * </code>
	 * 
	 * @param {String}[dbname]
	 *            database name.
	 * @param {Function}callback
	 *            回調函數。 callback(error)
	 * @param {String}[language]
	 *            database language (and database/host). default host: TOOLSDB.<br />
	 *            e.g., 'en', 'commons', 'wikidata', 'meta'.
	 * 
	 * @returns {SQL_session}instance
	 * 
	 * @constructor
	 */
	function SQL_session(dbname, callback, language) {
		if (!(this instanceof SQL_session)) {
			if (typeof language === 'object') {
				language = new_SQL_config(language);
			} else if (typeof language === 'string' && language) {
				// change language (and database/host).
				SQL_config.set_language(language);
				if (language === TOOLSDB)
					delete SQL_config.database;
				language = null;
			}
			// dbname as SQL query string.
			return run_SQL(dbname, callback, language);
		}

		if (typeof dbname === 'function' && !language) {
			// shift arguments
			language = callback;
			callback = dbname;
			dbname = null;
		}

		this.config = new_SQL_config(language || TOOLSDB);
		if (dbname) {
			if (typeof dbname === 'object') {
				Object.assign(this.config, dbname);
			} else {
				// 自動添加 prefix。
				this.config.database = this.config.db_prefix + dbname;
			}
		} else if (this.config.host === TOOLSDB) {
			delete this.config.database;
		} else {
			// this.config.database 已經在 set_SQL_config_language() 設定。
		}

		var _this = this;
		this.connect(function(error) {
			// console.error(error);
			if (error && error.code === 'ER_BAD_DB_ERROR'
					&& !_this.config.no_create && _this.config.database) {
				// Error: ER_BAD_DB_ERROR: Unknown database '...'
				create_database(_this.config, callback);
			} else if (typeof callback === 'function') {
				callback(error);
			}
		});
	}

	// need reset connection,
	function need_reconnect(error) {
		return error
		// Error: Cannot enqueue Handshake after fatal error.
		&& (error.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR'
		// ECONNRESET: socket hang up
		|| error.code === 'ECONNRESET');
	}

	// run SQL query
	SQL_session.prototype.SQL = function(SQL, callback) {
		var _this = this;
		this.connection.query(SQL, function(error) {
			if (need_reconnect(error)) {
				// re-connect. 可能已經斷線。
				_this.connection.connect(function(error) {
					if (error) {
						// console.error(error);
					}
					_this.connection.query(SQL, callback);
				});
			} else {
				callback.apply(null, arguments);
			}
		});
		return this;
	};

	SQL_session.prototype.connect = function(callback, force) {
		if (!force)
			try {
				var _this = this;
				this.connection.connect(function(error) {
					if (need_reconnect(error)) {
						// re-connect.
						_this.connect(callback, true);
					} else if (typeof callback === 'function')
						callback(error);
				});
				return this;
			} catch (e) {
				// TODO: handle exception
			}

		try {
			this.connection.end();
		} catch (e) {
			// TODO: handle exception
		}
		// 需要重新設定 this.connection，否則會出現:
		// Error: Cannot enqueue Handshake after invoking quit.
		this.connection = node_mysql.createConnection(this.config);
		this.connection.connect(callback);
		return this;
	};

	/**
	 * get database list.
	 * 
	 * <code>

	var SQL_session = new CeL.wiki.SQL('testdb',
	//
	function callback(error, rows, fields) {
		if (error)
			console.error(error);
		else
			s.databases(function(list) {
				console.log(list);
			});
	});

	</code>
	 * 
	 * @param {Function}callback
	 *            回調函數。
	 * @param {Boolean}all
	 *            get all databases. else: get my databases.
	 * 
	 * @returns {SQL_session}
	 */
	SQL_session.prototype.databases = function(callback, all) {
		var _this = this;
		function filter(dbname) {
			return dbname.startsWith(_this.config.db_prefix);
		}

		if (this.database_cache) {
			var list = this.database_cache;
			if (!all)
				// .filter() 會失去 array 之其他屬性。
				list = list.filter(filter);
			if (typeof callback === 'function')
				callback(list);
			return this;
		}

		var SQL = 'SHOW DATABASES';
		if (false && !all)
			// SHOW DATABASES LIKE 'pattern';
			SQL += " LIKE '" + this.config.db_prefix + "%'";

		this.connect(function(error) {
			// reset connection,
			// 預防 PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR
			_this.connection.query(SQL, function(error, rows, fields) {
				if (error || !Array.isArray(rows)) {
					library_namespace.error(error);
					rows = null;
				} else {
					rows = rows.map(function(row) {
						for ( var field in row)
							return row[field];
					});
					_this.database_cache = rows;
					if (!all)
						// .filter() 會失去 array 之其他屬性。
						rows = rows.filter(filter);
					// console.log(rows);
				}
				if (typeof callback === 'function')
					callback(rows);
			});
		});

		return this;
	};

	if (SQL_config) {
		library_namespace
				.debug('wiki_API.SQL_session: You may use SQL to get data.');
		wiki_API.SQL = SQL_session;
		// export 導出: CeL.wiki.SQL() 僅可在 Wikimedia Toolforge 上使用。
		wiki_API.SQL.config = SQL_config;
		// wiki_API.SQL.create = create_database;
	}

	// ----------------------------------------------------

	/**
	 * Convert MediaWiki database timestamp to ISO 8601 format.<br />
	 * UTC: 'yyyymmddhhmmss' → 'yyyy-mm-ddThh:mm:ss'
	 * 
	 * @param {String|Buffer}timestamp
	 *            MediaWiki database timestamp
	 * 
	 * @returns {String}ISO 8601 Data elements and interchange formats
	 * 
	 * @see https://www.mediawiki.org/wiki/Manual:Timestamp
	 */
	function SQL_timestamp_to_ISO(timestamp) {
		if (!timestamp) {
			// ''?
			return;
		}
		// timestamp可能為{Buffer}
		timestamp = timestamp.toString('utf8').chunk(2);
		if (timestamp.length !== 7) {
			// 'NULL'?
			return;
		}

		return timestamp[0] + timestamp[1]
		//
		+ '-' + timestamp[2] + '-' + timestamp[3]
		//
		+ 'T' + timestamp[4] + ':' + timestamp[5] + ':' + timestamp[6] + 'Z';
	}

	function generate_SQL_WHERE(condition, field_prefix) {
		var condition_array = [], value_array = [];

		if (typeof condition === 'string') {
			;

		} else if (Array.isArray(condition)) {
			// TODO: for ' OR '
			condition = condition.join(' AND ');

		} else if (library_namespace.is_Object(condition)) {
			for ( var name in condition) {
				var value = condition[name];
				if (value === undefined) {
					// 跳過這一筆設定。
					continue;
				}
				if (!name) {
					// condition[''] = [ condition 1, condition 2, ...];
					if (Array.isArray(value)) {
						value_array.append(value);
					} else {
						value_array.push(value);
					}
					return;
				}
				if (!/^[a-z_]+$/.test(name)) {
					throw 'Invalid field name: ' + name;
				}
				if (!name.startsWith(field_prefix)) {
					name = field_prefix + name;
				}
				var matched = typeof value === 'string'
				// TODO: for other operators
				// @see https://mariadb.com/kb/en/mariadb/select/
				// https://mariadb.com/kb/en/mariadb/functions-and-operators/
				&& value.match(/^([<>!]?=|[<>]|<=>|IN |IS )([\s\S]+)$/);
				if (matched) {
					name += matched[1] + '?';
					// DO NOT quote the value yourself!!
					value = matched[2];
					// Number.MAX_SAFE_INTEGER starts from 9.
					if (/^[+\-]?[1-9]\d{0,15}$/.test(value)
					// ↑ 15 = String(Number.MAX_SAFE_INTEGER).length-1
					&& +value <= Number.MAX_SAFE_INTEGER) {
						value = +value;
					}
				} else {
					name += '=?';
				}
				condition_array.push(name);
				value_array.push(value);
			}

			// TODO: for ' OR '
			condition = condition_array.join(' AND ');

		} else {
			library_namespace.error('Invalid condition: '
					+ JSON.stringify(condition));
			return;
		}

		return [ ' WHERE ' + condition, value_array ];
	}

	// ----------------------------------------------------

	// https://www.mediawiki.org/wiki/API:RecentChanges
	// const
	var ENUM_rc_type = 'edit,new,move,log,move over redirect,external,categorize';

	/**
	 * Get page title 頁面標題 list of [[Special:RecentChanges]] 最近更改.
	 * 
	 * @examples<code>
		// get title list
		CeL.wiki.recent(function(rows){console.log(rows.map(function(row){return row.title;}));}, {language:'ja', namespace:0, limit:20});
		// 應並用 timestamp + this_oldid
		CeL.wiki.recent(function(rows){console.log(rows.map(function(row){return [row.title,row.rev_id,row.row.rc_timestamp.toString()];}));}, {where:{timestamp:'>=20170327143435',this_oldid:'>'+43772537}});
		</code>
	 * 
	 * TODO: filter
	 * 
	 * @param {Function}callback
	 *            回調函數。 callback({Array}page title 頁面標題 list)
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項.
	 * 
	 * @see https://www.mediawiki.org/wiki/Manual:Recentchanges_table
	 */
	function get_recent_via_databases(callback, options) {
		if (options && (typeof options === 'string')) {
			options = {
				// treat options as language
				language : options
			};
		} else {
			options = library_namespace.setup_options(options);
		}

		var SQL = options.SQL;
		if (!SQL) {
			SQL = Object.create(null);
			if (options.bot === 0 || options.bot === 1) {
				// assert: 0 || 1
				SQL.bot = options.bot;
			}
			// 不指定namespace，或者指定namespace為((undefined)): 取得所有的namespace。
			/** {Integer|String}namespace NO. */
			var namespace = get_namespace(options.namespace);
			if (namespace !== undefined) {
				SQL.namespace = namespace;
			}
			Object.assign(SQL,
			// {String|Array|Object}options.where: 自訂篩選條件。
			options.where);
			SQL = generate_SQL_WHERE(SQL, 'rc_');

			// https://phabricator.wikimedia.org/T223406
			// TODO: 舊版上 `actor`, `comment` 這兩個資料表不存在會出錯，需要先偵測。
			var fields = [
					'*',
					// https://www.mediawiki.org/wiki/Manual:Actor_table#actor_id
					'(SELECT `actor_user` FROM `actor` WHERE `actor`.`actor_id` = `recentchanges`.`rc_actor`) AS `userid`',
					'(SELECT `actor_name` FROM `actor` WHERE `actor`.`actor_id` = `recentchanges`.`rc_actor`) AS `user_name`',
					// https://www.mediawiki.org/wiki/Manual:Comment_table#comment_id
					'(SELECT `comment_text` FROM `comment` WHERE `comment`.`comment_id` = `recentchanges`.`rc_comment_id`) AS `comment`',
					'(SELECT `comment_data` FROM `comment` WHERE `comment`.`comment_id` = `recentchanges`.`rc_comment_id`) AS `comment_data`' ];

			SQL[0] = 'SELECT ' + fields.join(',')
			// https://www.mediawiki.org/wiki/Manual:Recentchanges_table
			+ ' FROM `recentchanges`' + SQL[0]
			// new → old, may contain duplicate title.
			// or rc_this_oldid, but too slow (no index).
			+ ' ORDER BY `rc_timestamp` DESC LIMIT ' + (
			/** {ℕ⁰:Natural+0}limit count. */
			options.limit > 0 ? Math.min(options.limit
			// 筆數限制。就算隨意輸入，強制最多只能這麼多筆資料。
			, 1e3)
			// default records to get
			: options.where ? 1e4 : 100);
		}

		if (false) {
			console.log([ options.config, options.language,
					options[KEY_SESSION] && options[KEY_SESSION].language ]);
			console.log(options[KEY_SESSION]);
			throw 1;
		}

		run_SQL(SQL, function(error, rows, fields) {
			if (error) {
				callback();
				return;
			}

			var result = [];
			rows.forEach(function(row) {
				if (!(row.rc_user > 0) && !(row.rc_type < 5)
				//
				&& (!('rc_type' in options)
				//
				|| options.rc_type !== ENUM_rc_type[row.rc_type])) {
					// On wikis using Wikibase the results will otherwise be
					// meaningless.
					return;
				}
				var namespace_text
				//
				= get_namespace.name_of_NO[row.rc_namespace];
				if (namespace_text) {
					namespace_text = upper_case_initial(namespace_text) + ':';
				}
				// 基本上API盡可能與recentchanges一致。
				result.push({
					type : ENUM_rc_type[row.rc_type],
					// namespace
					ns : row.rc_namespace,
					// .rc_title未加上namespace prefix!
					title : (namespace_text
					// @see normalize_page_name()
					+ row.rc_title.toString()).replace(/_/g, ' '),
					// links to the page_id key in the page table
					// 0: 可能為flow. 此時title為主頁面名，非topic。由.rc_params可獲得相關資訊。
					pageid : row.rc_cur_id,
					// rev_id
					// Links to the rev_id key of the new page revision
					// (after the edit occurs) in the revision table.
					revid : row.rc_this_oldid,
					old_revid : row.rc_last_oldid,
					rcid : row.rc_id,
					user : row.user_name && row.user_name.toString()
					// text of the username for the user that made the
					// change, or the IP address if the change was made by
					// an unregistered user. Corresponds to rev_user_text
					//
					// `rc_user_text` deprecated: MediaWiki version: ≤ 1.33
					|| row.rc_user_text && row.rc_user_text.toString(),
					// NULL for anonymous edits
					userid : row.userid
					// 0 for anonymous edits
					// `rc_user` deprecated: MediaWiki version: ≤ 1.33
					|| row.rc_user,
					// old_length
					oldlen : row.rc_old_len,
					// new length
					newlen : row.rc_new_len,
					// Corresponds to rev_timestamp
					// use new Date(.timestamp)
					timestamp : SQL_timestamp_to_ISO(row.rc_timestamp),
					comment : row.comment && row.comment.toString()
					// `rc_comment` deprecated: MediaWiki version: ≤ 1.32
					|| row.rc_comment && row.rc_comment.toString(),
					// usually NULL
					comment_data : row.comment_data
							&& row.comment_data.toString(),
					// parsedcomment : TODO,
					logid : row.rc_logid,
					// TODO
					logtype : row.rc_log_type,
					logaction : row.rc_log_action.toString(),
					// logparams: TODO: should be {Object}, e.g., {userid:0}
					logparams : row.rc_params.toString(),
					// tags: ["TODO"],

					// 以下為recentchanges之外，本函數額外加入。
					is_new : !!row.rc_new,
					// e.g., 1 or 0
					// is_bot : !!row.rc_bot,
					// is_minor : !!row.rc_minor,
					// e.g., mw.edit
					is_flow : row.rc_source.toString() === 'flow',
					// patrolled : !!row.rc_patrolled,
					// deleted : !!row.rc_deleted,

					row : row
				});
			});
			callback(result);
		},
		// SQL config
		options.config || options.language || options[KEY_SESSION]);
	}

	function get_recent_via_API(callback, options) {
		var session = options && options[KEY_SESSION];
		if (!session) {
			// 先設定一個以方便操作。
			session = new wiki_API(null, null, options.language
					|| default_language);
		}
		// use get_list()
		session.recentchanges(function(rows) {
			// {Array}rows
			callback(rows);
		}, options);
	}

	// 一定會提供的功能。
	wiki_API.recent_via_API = get_recent_via_API;
	// 可能會因環境而不同的功能。讓 wiki_API.recent 採用較有效率的實現方式。
	wiki_API.recent = SQL_config ? get_recent_via_databases
			: get_recent_via_API;

	// ----------------------------------------------------

	// 監視最近更改的頁面。
	// 注意: 會改變 options！
	// 注意: options之屬性名不可與wiki_API.recent衝突！
	// 警告: 同時間只能有一隻程式在跑，否則可能會造成混亂！
	function add_listener(listener, options) {
		if (!options) {
			options = Object.create(null);
		} else if (options > 0) {
			options = {
				interval : options
			};
		} else if (typeof options === 'string'
		//
		|| library_namespace.is_RegExp(options)) {
			options = {
				// language : '',
				// title_filter
				title : options
			};
		}

		if (!(options.limit > 0)) {
			// https://www.mediawiki.org/w/api.php?action=help&modules=query%2Brevisions
			options.rvlimit = 500;
		}

		var session = options[KEY_SESSION],
		// @see .SQL_config
		where = options.SQL_options
		//
		|| (options.SQL_options = Object.create(null));
		where = where.where || (where.where = Object.create(null));
		// console.log(session);

		if (!session
		//
		&& (options.with_diff || options.with_content)) {
			// 先設定一個以方便操作。
			session = new wiki_API(null, null, options.language
					|| default_language);
		}

		var use_SQL = SQL_config
		// options.use_SQL: 明確指定 use SQL. use SQL as possibile
		&& (options.use_SQL || !options.parameters
		// 只設定了rcprop
		|| Object.keys(options.parameters).join('') === 'rcprop'), recent_options,
		//
		get_recent = use_SQL ? get_recent_via_databases : get_recent_via_API,
		// 僅取得最新版本。注意: 這可能跳過中間編輯的版本，造成有些修訂被忽略。
		latest_only = 'latest' in options ? options.latest : true;
		if (use_SQL) {
			recent_options = options.SQL_options;
			if (options[KEY_SESSION]) {
				// pass API config
				recent_options[KEY_SESSION] = options[KEY_SESSION];
			}
		} else {
			// https://www.mediawiki.org/w/api.php?action=help&modules=query%2Brecentchanges
			recent_options = {
				// List newest first (default).
				// Note: rcstart has to be later than rcend.
				// rcdir : 'older',
				rcdir : 'newer',

				// new Date().toISOString()
				// rcstart : 'now',
				rctype : 'edit|new'
			};
			if (latest_only) {
				recent_options.rctoponly = 1;
			}
			if (options.parameters) {
				// 警告:這會更動options!
				Object.assign(options.parameters, recent_options);
				recent_options = options;
			} else {
				recent_options = Object.assign({
					parameters : recent_options
				}, options);
			}
			if (recent_options.parameters.rcprop
			// 為了之後設定 last_query_time，因此必須要加上timestamp這一項information。
			&& !recent_options.parameters.rcprop.includes('timestamp')) {
				if (Array.isArray(recent_options.parameters.rcprop))
					recent_options.parameters.rcprop.push('timestamp');
				else if (typeof recent_options.parameters.rcprop)
					recent_options.parameters.rcprop += '|timestamp';
				else
					throw 'Unkonwn rcprop: ' + recent_options.parameters.rcprop;
			}
		}

		var namespace = get_namespace(options.namespace);
		if (namespace !== undefined) {
			// 不指定namespace，或者指定namespace為((undefined)): 取得所有的namespace。
			if (use_SQL) {
				recent_options.namespace = namespace;
			} else {
				recent_options.parameters.rcnamespace = namespace;
			}
		}

		if (options.type) {
			if (use_SQL) {
				recent_options.type = options.type;
			} else {
				recent_options.parameters.rctype = options.type;
			}
			// TODO: other options
		}

		if (options.with_diff && !options.with_diff.diff
				&& !options.with_diff.with_diff) {
			options.with_diff.diff = true;
		}

		// 注意:
		// {String|Natural}options.start, options.delay:
		// 將會用 CeL.date.to_millisecond() 來解析。
		// 推薦用像是 "2days", "3min", "2d", "3m" 這樣子的方法來表現。
		//
		// {Date}options.start: 從這個時間點開始回溯。
		// {Natural}options.start: 回溯 millisecond 數。
		// {Natural}options.delay > 0: 延遲時間,等待 millisecond 數。

		var delay_ms = library_namespace.to_millisecond(options.delay),
		//
		interval = library_namespace.to_millisecond(options.interval) || 500,
		// assert: {Date}last_query_time start time
		last_query_time,
		// TODO: 僅僅採用last_query_revid做控制，不需要偵測是否有重複。
		last_query_revid = options.revid | 0,
		// {String}設定頁面。 注意: 必須是已經轉換過、正規化後的最終頁面標題。
		configuration_page_title = typeof options.adapt_configuration === 'function'
				&& normalize_page_name(options.configuration_page);

		if (!(delay_ms > 0))
			delay_ms = 0;

		if (library_namespace.is_Date(options.start)) {
			last_query_time = isNaN(options.start.getTime()) ? new Date
					: options.start;
		} else if (options.start
				&& !isNaN(last_query_time = Date.parse(options.start))) {
			last_query_time = new Date(last_query_time);
		} else if ((last_query_time = library_namespace
				.to_millisecond(options.start)) > 0) {
			// treat as time back to 回溯這麼多時間。
			if (last_query_time > library_namespace.to_millisecond('31d')) {
				library_namespace
						.info('add_listener: 2017 CE 最多約可回溯30天。您所指定的時間 ['
								+ options.start + '] 似乎過長了。');
			}
			last_query_time = new Date(Date.now() - last_query_time);
		} else {
			// default: search from NOW
			last_query_time = new Date;
		}

		library_namespace.info('add_listener: 開始監視 / scan '
		//
		+ (session && session.language || default_language)
		//
		+ (session && session.family ? '.' + session.family : '') + ' '
		//
		+ (Date.now() - last_query_time > 100 ?
		//
		library_namespace.age_of(last_query_time, Date.now()) + ' 前開始' : '最近')
				+ '更改的頁面。');

		if (configuration_page_title) {
			library_namespace.info('add_listener: Configuration page: '
					+ get_page_title_link(configuration_page_title));
		}

		if (false) {
			library_namespace.debug('recent_options: '
			// TypeError: Converting circular structure to JSON
			+ JSON.stringify(recent_options), 1, 'add_listener');
		}

		// 取得頁面資料。
		function receive() {
			function receive_next() {
				var real_interval_ms = Date.now() - receive_time;
				library_namespace
						.debug('interval from latest receive() starts: '
								+ real_interval_ms + ' ms (' + Date.now()
								+ ' - ' + receive_time + ')', 3, 'receive_next');
				setTimeout(receive,
				// 減去已消耗時間，達到更準確的時間間隔控制。
				Math.max(interval - real_interval_ms, 0));
			}

			// 上一次執行receive()的時間
			var receive_time = Date.now();

			library_namespace.debug('Get recent change from '
					+ (library_namespace.is_Date(last_query_time)
							&& last_query_time.getTime() ? last_query_time
							.toISOString() : last_query_time)
					+ ', last_query_revid=' + last_query_revid, 1,
					'add_listener.receive');

			// 根據不同的實現方法採用不一樣的因應方式。
			if (use_SQL) {
				if (!library_namespace.is_Date(last_query_time)) {
					// assert: !!(last_query_time)
					// 可能來自"設定成已經取得的最新一個編輯rev。"
					last_query_time = new Date(last_query_time);
				}
				where.timestamp = '>=' + last_query_time
				// MediaWiki format
				.format('%4Y%2m%2d%2H%2M%2S');
				where.this_oldid = '>' + last_query_revid;
				if (delay_ms > 0) {
					where[''] = 'rc_timestamp<='
					// 截止期限。
					+ new Date(Date.now() - delay_ms)
					// MediaWiki format
					.format('%4Y%2m%2d%2H%2M%2S');
				}
			} else {
				// rcend
				recent_options.parameters.rcstart = library_namespace
						.is_Date(last_query_time) ? last_query_time
						.toISOString() : last_query_time;
				if (false) {
					console.log('set rcstart: '
							+ recent_options.parameters.rcstart);
				}
				if (delay_ms > 0) {
					recent_options.parameters.rcend
					// 截止期限。
					= new Date(Date.now() - delay_ms).toISOString();
				}
			}

			get_recent(function(rows) {
				if (!rows) {
					library_namespace.warn((new Date).toISOString()
							+ ': No rows get.');
					return;
				}

				if (false) {
					library_namespace.log(recent_options.parameters
							|| recent_options.SQL_options);
					console.log(rows);
				}

				if (false) {
					library_namespace.log('去除掉重複的紀錄之前 last_query_revid: '
							+ last_query_revid + ', ' + rows.length
							+ ' records:');
					library_namespace.log(rows.map(function(row) {
						return row.revid;
					}));
				}
				// 去除之前已經處理過的頁面。
				if (rows.length > 0) {
					// 判別新舊順序。
					if (rows.length > 1 && rows[0].revid > rows[1].revid) {
						// e.g., use SQL
						// 把從新的排列到舊的轉成從舊的排列到新的。
						// .reverse(): 轉成 old to new.
						rows.reverse();
					}

					if (rows.length > options.max_page) {
						// assert: options.max_page > 0
						// 直接截斷，僅處理到 .max_page。
						rows.truncate(options.max_page);
					}

					// cache the lastest record
					last_query_time = rows[rows.length - 1];
					// e.g., use API
					while (rows.length > 0
					// 去除掉重複的紀錄。因為是從舊的排列到新的，因此從起頭開始去除。
					&& rows[0].revid <= last_query_revid) {
						rows.shift();
					}

					// 預設全部都處理完，因此先登記。假如僅處理其中的一部分，屆時再特別登記。
					if (false) {
						library_namespace.log('The lastest record: '
								+ JSON.stringify(last_query_time));
					}

					// 紀錄/標記本次處理到哪。
					// 注意：type=edit會增加revid，其他type似乎會沿用上一個revid。
					last_query_revid = last_query_time.revid;
					// 確保 {Date}last_query_time
					// last_query_time = new Date(last_query_time.timestamp);
					last_query_time = last_query_time.timestamp;
				}
				if (false) {
					library_namespace.log('去除掉重複的紀錄之後 last_query_revid: '
							+ last_query_revid + ', ' + rows.length
							+ ' records left:');
					library_namespace.log(rows.map(function(row) {
						return row.revid;
					}).join(', '));
				}

				// 使 wiki.listen() 可隨時監視設定頁面與緊急停止頁面的變更。
				var configuration_row;
				if (configuration_page_title) {
					// 檢測看看是否有 configuration_page_title
					rows.forEach(function(row, index) {
						if (row.title === configuration_page_title)
							configuration_row = row;
					});
				}
				if (configuration_row) {
					library_namespace.info('add_listener: Configuration page '
							+ get_page_title_link(configuration_page_title)
							+ ' edited. Re-parse...');
				}

				if (options.filter && rows.length > 0) {
					// TODO: 把篩選功能放到get_recent()，減少資料處理的成本。
					rows = rows.filter(
					// 篩選函數。rcprop必須加上篩選函數需要的資料，例如編輯摘要。
					typeof options.filter === 'function' ? options.filter
					// 篩選標題。警告:從API取得的標題不包括"/"之後的文字，因此最好還是等到之後listener處理的時候，才來對標題篩選。
					: library_namespace.is_RegExp(options.filter)
					// 篩選PATTERN
					? function(row) {
						return row.title && options.filter.test(row.title);
					} : Array.isArray(options.filter) ? function(row) {
						return row.title && options.filter.includes(row.title);
					} : function(row) {
						if (false)
							library_namespace.log([ row.title, options.filter,
									normalize_page_name(options.filter) ]);
						// assert: typeof options.filter === 'string'
						return row.title
						// treat options.filter as page title
						&& (row.title.includes(options.filter)
						// 區分大小寫
						|| row.title.startsWith(
						//
						normalize_page_name(options.filter)));
					});
					library_namespace.debug('Get ' + rows.length
							+ ' recent pages after filter:\n'
							+ rows.map(function(row) {
								return row.revid;
							}), 2, 'add_listener');
					// console.log([ row.title, options.filter ]);
				}

				// TODO: configuration_row 應該按照 rows 的順序，
				// 並且假如特別 filter 到設定頁面的時候，那麼設定頁面還是應該要被 listener 檢查。
				if (configuration_row && !rows.includes(configuration_row)) {
					// 保證 configuration_page_title 的變更一定會被檢查到
					rows.unshift(configuration_row);
				}

				var exit;
				if (rows.length > 0) {
					library_namespace.debug('Get ' + rows.length
							+ ' recent pages:\n' + rows.map(function(row) {
								return row.revid;
							}), 2, 'add_listener');

					// 比較頁面修訂差異。
					if (options.with_diff || options.with_content >= 2) {
						// https://www.mediawiki.org/w/api.php?action=help&modules=query%2Brevisions
						// rvdiffto=prev 已經parsed，因此仍須自行解析。
						// TODO: test
						// 因為採用.run_async(.page())，因此約一秒會跑一頁面。
						rows.run_async(function(run_next, row, index, list) {
							// console.log(row);
							if (!row.pageid) {
								run_next();
								return;
							}

							library_namespace.debug(
							//
							'Get page: ' + index + '/' + rows.length, 2,
									'add_listener.with_diff');

							var page_options = {
								// 這裡的rvstartid指的是新→舊。
								// 偶爾有可能出現: [badid_rvstartid] No revision was
								// found for parameter "rvstartid".
								rvstartid : row.revid
							};
							// or: row.old_revid >= 0
							if (row.old_revid > 0) {
								page_options.rvendid = row.old_revid;
							}

							page_options = Object.assign({
								is_id : true,
								rvlimit : options.with_content >= 3
								// default: 僅取最近的兩個版本作 diff
								? options.with_content : 2,
								// https://www.mediawiki.org/w/api.php?action=help&modules=query%2Brevisions
								parameters : page_options,
								rvprop
								// e.g.,
								// minor:'',anon:''/* e.g., IP user 匿名用戶 */,
								// bot flag: ('bot' in row)
								: 'ids|content|timestamp|user|flags|size'
							}, options.with_diff);

							session.page(row.pageid,
							//
							function(page_data, error) {
								if (exit || !page_data || error) {
									if (error)
										console.error(error);
									run_next();
									return;
								}

								var revisions = page_data.revisions;
								if (latest_only && (!revisions || !revisions[0]
								// 確定是最新版本 revisions[0].revid。
								|| revisions[0].revid !== row.revid)) {
									library_namespace.log(
									//
									'add_listener.with_diff: '
									//
									+ get_page_title_link(row)
									//
									+ ': 從 recentchanges table 取得的版本 '
									//
									+ row.revid + ' 不同於從頁面內容取得的最新版本 '
									//
									+ (revisions && revisions[0]
									//
									&& revisions[0].revid) + '，跳過這一項。');
									run_next();
									return;
								}

								// merge page data
								Object.assign(row, page_data);

								// console.log(revisions);
								if (revisions && revisions.length >= 1
								//
								&& revisions[0] && revisions[0].timestamp) {
									// 設定成已經取得的最新一個編輯rev。
									last_query_time
									// 確保 {Date}last_query_time
									// = new Date(revisions[0].timestamp);
									= revisions[0].timestamp;
									// last_query_revid = revisions[0].revid;
								}

								// assert: (row.is_new || revisions.length > 1)
								if (revisions && revisions.length >= 1
										&& options.with_diff) {

									// get_page_content(row, -1);
									var from = revisions.length > 1 &&
									// select the oldest revision.
									revisions[revisions.length - 1]['*'] || '',
									// 解析頁面結構。
									to = revisions[0]['*'] || '';

									if (!options.with_diff.line) {
										from = page_parser(from).parse();
										row.from_parsed = from;
										// console.log(from);
										from = from.map(function(token) {
											if (!token && (token !== ''
											// 有時會出意外。
											|| from.length !== 1)) {
												console.log(row);
												throw row.title;
											}
											return token.toString();
										});

										page_parser(row);
										to = page_parser(row).parse();
										to = to.map(function(token) {
											if (!token && (token !== ''
											//
											|| to.length !== 1)) {
												console.log(row);
												throw row.title;
											}
											return token.toString();
										});

										// verify

										if ((revisions[0]['*'] || '') !== to
												.join('')) {
											console.log(revisions[0]['*']);
											console.log(to);
											to = revisions[0]['*'];
											console.log(library_namespace.LCS(
											//
											to, parse_wikitext(to).toString(),
													'diff'));
											throw 'Parser error (to): ' +
											// debug 用. check parser, test
											// if parser working properly.
											get_page_title_link(page_data);
										}

										if (revisions.length > 1 &&
										//
										(revisions[revisions.length - 1]
										//
										['*'] || '') !== from.join('')) {
											console.log(library_namespace.LCS(
											//
											revisions[revisions.length - 1]
											//
											['*'], from.join(''), 'diff'));
											throw 'Parser error (from): ' +
											// debug 用. check parser, test
											// if parser working properly.
											get_page_title_link(page_data);
										}
									}

									if (options.with_diff.LCS) {
										row.diff = library_namespace.LCS(from,
												to, options.with_diff);

									} else {
										row.diff = from.diff_with(to,
												options.with_diff);
									}
								}

								if (configuration_row === row) {
									options.adapt_configuration(
									// (page_data)
									parse_configuration(row));
									run_next();
									return;
								}

								if (exit = listener.call(options, row, index,
										rows)) {
									last_query_time = new Date;
								}

								run_next();
							}, page_options);

						}, function() {
							if (!exit) {
								library_namespace.debug(
										'Get next recent pages', 2,
										'add_listener.with_diff');
								receive_next();
							}
						});
						return;
					}

					// use options.with_content as the options of wiki.page()
					if (options.with_content || configuration_row) {
						// TODO: 考慮所傳回之內容過大，i.e. 回傳超過 limit (12 MB)，被截斷之情形。
						session.page(rows.map(function(row) {
							return row.pageid;
						}), function(page_list, error) {
							if (error || !Array.isArray(page_list)) {
								// e.g., 還原編輯
								// wiki_API.page: Unknown response:
								// [{"batchcomplete":""}]
								if (error !== 'Unknown response')
									library_namespace.error(error
											|| 'add_listener: No page got!');
								receive_next();
								return;
							}

							// 配對。
							var page_id_hash = Object.create(null);
							page_list.forEach(function(page_data, index) {
								page_id_hash[page_data.pageid] = page_data;
							});
							exit = rows.some(function(row, index) {
								if (false) {
									console.log('-'.repeat(40));
									console.log(JSON.stringify(row));
									console.log(JSON.stringify(
									//
									page_id_hash[row.pageid]));
								}
								Object.assign(row, page_id_hash[row.pageid]);
								if (configuration_row === row) {
									options.adapt_configuration(
									//
									parse_configuration(row));
									return;
								}
								listener.call(options, row, index, rows);
							});
							// Release memory. 釋放被占用的記憶體.
							page_id_hash = page_list = null;
							if (!exit) {
								receive_next();
							}

						}, Object.assign({
							// rvdiffto : 'prev',
							// rvcontentformat : 'text/javascript',
							is_id : true,
							multi : true
						}, options.with_content));
						return;
					}

					// 除非設定 options.input_Array，否則單筆單筆輸入。
					if (options.input_Array) {
						exit = listener.call(options, rows);
					} else {
						exit = rows.some(listener, options);
					}

				} else if (options.even_empty) {
					// default: skip empty, 除非設定 options.even_empty.
					exit = listener.call(options, options.input_Array ? rows
					// 模擬rows單筆之結構。
					: {
						row : Object.create(null)
					});
				}

				// if listener() return true, the operation will be stopped.
				if (!exit) {
					receive_next();
				}

			}, recent_options);
		}

		receive();
	}

	// wiki.listen()
	wiki_API.listen = add_listener;

	// --------------------------------------------------------------------------------------------

	/**
	 * 取得最新之 Wikimedia dump。
	 * 
	 * @param {String}[wiki_site_name]
	 *            project code name. e.g., 'enwiki'
	 * @param {Function}callback
	 *            回調函數。
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * 
	 * @see https://en.wikipedia.org/wiki/Wikipedia:Database_download#Where_do_I_get_it.3F
	 * 
	 * @inner
	 */
	function get_latest_dump(wiki_site_name, callback, options) {
		if (false && !wmflabs) {
			// 最起碼須有 bzip2, wget 特定版本輸出訊息 @ /bin/sh
			// Wikimedia Toolforge (2017/8 之前舊稱 Tool Labs)
			// https://wikitech.wikimedia.org/wiki/Labs_labs_labs#Toolforge
			throw new Error('Only for Wikimedia Toolforge!');
		}

		if (typeof wiki_site_name === 'function'
				&& typeof callback !== 'function' && !options) {
			// shift arguments
			options = callback;
			callback = wiki_site_name;
			wiki_site_name = null;
		}

		// 正規化並提供可隨意改變的同內容參數，以避免修改或覆蓋附加參數。
		options = library_namespace.new_options(options);

		if (!wiki_site_name) {
			// console.log(options);
			// console.log(options[KEY_SESSION]);
			// throw options[KEY_SESSION].language;
			wiki_site_name = language_to_site_name(options[KEY_SESSION]
					|| options.project || options.family);
		}

		// dump host: http "301 Moved Permanently" to https
		var host = options.host || 'https://dumps.wikimedia.org/',
		// e.g., '20160305'.
		latest = options.latest;
		if (!latest) {
			get_URL(
			// Get the latest version.
			host + wiki_site_name + '/', function(XMLHttp) {
				var response = XMLHttp.responseText;
				var latest = 0, previous, matched,
				//
				PATTERN = / href="(\d{8,})/g;
				while (matched = PATTERN.exec(response)) {
					matched = Math.floor(matched[1]);
					if (latest < matched)
						previous = latest, latest = matched;
				}
				// 不動到原來的 options。
				options = Object.clone(options);
				// default: 'latest'
				options.latest = latest || 'latest';
				if (previous)
					options.previous = previous;
				get_latest_dump(wiki_site_name, callback, options);
			});
			return;
		}

		var directory = options.directory || './',
		//
		filename = options.filename || wiki_site_name + '-' + latest
				+ '-pages-articles.xml';

		/**
		 * <code>
		head -n 80 zhwiki-20160305-pages-meta-current1.xml
		less zhwiki-20160305-pages-meta-current1.xml
		tail -n 80 zhwiki-20160305-pages-meta-current1.xml
		</code>
		 */

		/**
		 * e.g., <code>
		callback = function(data) { console.log(data); };
		latest = '20160305';
		wiki_site_name = 'enwiki';
		// directory to restore dump files.
		// 指定 dump file 放置的 directory。
		// e.g., '/shared/cache/', '/shared/dumps/', '~/dumps/'
		// https://wikitech.wikimedia.org/wiki/Help:Toolforge/Developing#Using_the_shared_Pywikibot_files_.28recommended_setup.29
		// /shared/: shared files
		dump_directory = '/shared/cache/'
		filename = wiki_site_name + '-' + latest + '-pages-articles-multistream-index.txt';
		</code>
		 */

		// 若是目標目錄不存在/已刪除則嘗試創建之。
		try {
			node_fs.statSync(directory);
		} catch (e) {
			library_namespace.info('get_latest_dump: 存放 dump file 的目錄['
					+ directory + ']不存在/已刪除，嘗試創建之。');
			node_fs.mkdirSync(directory, parseInt('777', 8));
			node_fs.writeFileSync(directory
					+ '_FEEL_FREE_TO_REMOVE_THIS_DIRECTORY_ANYTIME', '');
			// 若是沒有辦法創建目錄，那就直接throw。
		}

		var data_file_OK;
		try {
			// check if file exists
			data_file_OK = node_fs.statSync(directory + filename);
		} catch (e) {
		}

		if (data_file_OK) {
			library_namespace.log('get_latest_dump: Using data file (.xml): ['
					+ directory + filename + ']');
			callback(directory + filename);
			return;
		}

		// ----------------------------------------------------

		function extract() {
			library_namespace.log('get_latest_dump.extract: Extracting ['
					+ source_directory + archive + ']...');
			// share the xml dump file. 應由 caller 自行設定。
			// process.umask(parseInt('0022', 8));
			require('child_process').exec(
			//
			'/bin/bzip2 -cd "' + source_directory + archive + '" > "'
			//
			+ directory + filename + '"', function(error, stdout, stderr) {
				if (error) {
					library_namespace.error(error);
				} else {
					library_namespace.log(
					//
					'get_latest_dump.extract: Done. Running callback...');
				}
				callback(directory + filename);
			});
		}

		var public_dumps_directory = '/public/dumps/public/',
		// search the latest file in the local directory.
		// https://wikitech.wikimedia.org/wiki/Help:Tool_Labs#Dumps
		// 可在 /public/dumps/public/zhwiki/ 找到舊 dumps。 (using `df -BT`)
		// e.g.,
		// /public/dumps/public/zhwiki/20160203/zhwiki-20160203-pages-articles.xml.bz2
		source_directory, archive = options.archive || filename + '.bz2';

		if (wmflabs) {

			source_directory = public_dumps_directory + wiki_site_name + '/'
					+ latest + '/';
			library_namespace.debug('Check if public dump archive exists: ['
					+ source_directory + archive + ']', 1, 'get_latest_dump');
			try {
				node_fs.accessSync(source_directory + archive);
				library_namespace.log('get_latest_dump: Public dump archive ['
						+ source_directory + archive + '] exists.');
				extract();
				return;
			} catch (e) {
			}
		}

		// ----------------------------------------------------

		source_directory = directory;

		library_namespace.debug('Check if file exists: [' + source_directory
				+ archive + ']', 1, 'get_latest_dump');
		try {
			node_fs.statSync(source_directory + archive);
			library_namespace.log('get_latest_dump: Archive ['
					+ source_directory + archive + '] exists.');
			extract();
			return;
		} catch (e) {
		}

		// ----------------------------------------------------

		library_namespace.log('get_latest_dump: Try to save archive to ['
				+ source_directory + archive + ']...');
		// https://nodejs.org/api/child_process.html
		var child = require('child_process').spawn('/usr/bin/wget',
		// -O=""
		[ '--output-document=' + source_directory + archive,
		// 經測試，採用 .spawn() 此種方法毋須考慮 '"' 之類 quote 的問題。
		host + wiki_site_name + '/' + latest + '/' + archive ]);

		child.stdout.setEncoding('utf8');
		child.stderr.setEncoding('utf8');

		/**
		 * http://stackoverflow.com/questions/6157497/node-js-printing-to-console-without-a-trailing-newline
		 * 
		 * In Windows console (Linux, too), you should replace '\r' with its
		 * equivalent code \033[0G:
		 */
		child.stdout.on('data', function(data) {
			process.stdout.write(data);
		});

		child.stderr.on('data', function(data) {
			data = data.toString('utf8');
			/**
			 * <code>
			 e.g.,
			259000K .......... .......... .......... .......... .......... 21%  282M 8m26s
			999950K .......... .......... .......... .......... .......... 82% 94.2M 1m46s
			1000000K .......... .......... .......... .......... .......... 82%  103M 1m46s
			</code>
			 */
			// [ all, downloaded, percentage, speed, remaining 剩下時間 ]
			var matched = data
					.match(/([^\n\.]+)[.\s]+(\d+%)\s+([^\s]+)\s+([^\s]+)/);
			if (matched) {
				data = matched[2] + '  ' + matched[1] + '  ' + matched[4]
						+ '                    \r';
			} else if (data.includes('....') || /\d+[ms]/.test(data)
					|| /\.\.\s*\d+%/.test(data))
				return;
			process.stderr.write(data);
		});

		child.on('close', function(error_code) {
			if (error_code) {
				library_namespace.error('get_latest_dump: Error code '
						+ error_code);
				// 有時最新版本可能 dump 到一半，正等待中。
				if (options.previous) {
					library_namespace.info(
					// options.previous: latest 的前一個版本。
					'get_latest_dump: Use previous version: ['
							+ options.previous + '].');
					options.latest = options.previous;
					delete options.previous;
					get_latest_dump(wiki_site_name, callback, options);
				} else {
					callback();
				}
				return;
			}

			library_namespace.log('get_latest_dump: Got archive file ['
					+ source_directory + archive + '].');
			extract();
		});
	}

	/**
	 * 還原 XML text 成原先之文本。
	 * 
	 * @param {String}xml
	 *            XML text
	 * 
	 * @returns {String}還原成原先之文本。
	 * 
	 * @inner
	 */
	function unescape_xml(xml) {
		return xml.replace(/&quot;/g, '"')
		// 2016/3/11: Wikimedia dumps do NOT include '&apos;'.
		.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
		// MUST be the last one.
		.replace(/&amp;/g, '&');
	}

	/**
	 * Parse Wikimedia dump xml text.
	 * 
	 * @param {String}xml
	 *            xml text
	 * @param {ℕ⁰:Natural+0}[start_index]
	 *            start index to parse.
	 * @param {Function}[filter]
	 *            filter :<br />
	 *            function(pageid, revid) { return {Boolean}need_process; }
	 * 
	 * @returns {Object}page_data =
	 *          {pageid,ns,title,revisions:[{revid,timestamp,'*'}]}
	 */
	function parse_dump_xml(xml, start_index, filter) {
		if (!(start_index >= 0))
			start_index = 0;

		// 主要頁面內容所在。
		var revision_index = xml.indexOf('<revision>', start_index);
		if (revision_index === NOT_FOUND
		// check '<model>wikitext</model>'
		// || xml.indexOf('<model>wikitext</model>') === NOT_FOUND
		) {
			// 有 end_mark '</page>' 卻沒有 '<revision>'
			library_namespace.error('parse_dump_xml: Bad data:\n'
					+ xml.slice(0, index));
			return;
		}

		var pageid = xml.between('<id>', '</id>', start_index) | 0,
		// ((revid|0)) 可能出問題。
		revid = Math.floor(xml.between('<id>', '</id>', revision_index));

		if (filter && !filter(pageid, revid)) {
			if (false)
				library_namespace.debug('Skip id ' + pageid, 4,
						'parse_dump_xml');
			return;
		}

		// page 之 structure 按照 wiki API 本身之 return
		// page_data = {pageid,ns,title,revisions:[{revid,timestamp,'*'}]}
		// includes redirection 包含重新導向頁面.
		// includes non-ns0.
		var page_data = {
			pageid : pageid,
			ns : xml.between('<ns>', '</ns>', start_index) | 0,
			title : unescape_xml(xml
					.between('<title>', '</title>', start_index)),
			revisions : [ {
				// rev_id
				revid : revid,
				// e.g., '2000-01-01T00:00:00Z'
				timestamp : xml.between('<timestamp>', '</timestamp>',
						revision_index),
				// old: e.g., '<text xml:space="preserve" bytes="80">'??
				// 2016/3/11: e.g., '<text xml:space="preserve">'
				'*' : unescape_xml(xml.between('<text xml:space="preserve">',
						'</text>', revision_index))
			} ]
		};

		return page_data;
	}

	/**
	 * 讀取/parse Wikimedia dumps 之 xml 檔案。
	 * 
	 * 注意: 必須自行 include 'application.platform.nodejs'。 <code>
	   CeL.run('application.platform.nodejs');
	 * </code><br />
	 * 
	 * @param {String}[filename]
	 *            欲讀取的 .xml 檔案名稱。
	 * @param {Function}callback
	 *            回調函數。 callback({Object}page_data)
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * 
	 * @returns {String}file path
	 * 
	 * @see <a href="http://dumps.wikimedia.org/backup-index.html">Wikimedia
	 *      database backup dumps</a>
	 * @see https://www.mediawiki.org/wiki/Help:Export
	 * 
	 * @since 2016/3/11
	 */
	function read_dump(filename, callback, options) {
		if (typeof filename === 'function' && typeof callback !== 'function'
				&& !options) {
			// shift arguments
			options = callback;
			callback = filename;
			filename = null;
		}

		if (typeof filename !== 'string' || !filename.endsWith('.xml')) {
			if (filename) {
				library_namespace.log('read_dump: Invalid file path: ['
						+ filename + '], try to get the latest dump file...');
			}
			get_latest_dump(filename, function(filename) {
				read_dump(filename, callback, options);
			}, options);
			// 警告: 無法馬上取得檔案時，將不會回傳任何資訊！
			return;
		}

		options = library_namespace.setup_options(options);

		if (typeof options.first === 'function') {
			options.first(filename);
		}

		var run_last = function(quit_operation) {
			library_namespace.debug('Finish work.', 1, 'read_dump');
			if (run_last && typeof options.last === 'function') {
				options.last.call(file_stream, anchor, quit_operation);
			}
			// run once only.
			run_last = null;
		},
		/** {String}file encoding for dump file. */
		encoding = options.encoding || wiki_API.encoding,
		/** {String}處理中之資料。 */
		buffer = '',
		/** end mark */
		end_mark = '</page>',
		/**
		 * 錨/定位點.<br />
		 * anchor[pageid] = [ position of the xml dump file, page length in
		 * bytes ]
		 * 
		 * @type {Array}
		 */
		anchor = options.anchor && [],
		//
		filter = options.filter,
		/**
		 * dump file stream.
		 * 
		 * filename: XML file path.<br />
		 * e.g., 'enwiki-20160305-pages-meta-current1.xml'
		 * 
		 * @type {String}
		 */
		file_stream = new node_fs.ReadStream(filename, {
			// 加大 buffer。據測試，改到 1 MiB 反而慢。
			highWaterMark : 128 * 1024
		}),
		/**
		 * 掌握進度用。 (100 * file_status.pos / file_status.size | 0) + '%'<br />
		 * 此時 stream 可能尚未初始化，(file_stream.fd===null)，<br />
		 * 因此不能使用 fs.fstatSync()。
		 * 
		 * @type {Object}
		 */
		// file_status = node_fs.fstatSync(file_stream.fd);
		// file_status = node_fs.statSync(filename),
		/** {Natural}檔案長度。掌握進度用。 */
		// file_size = node_fs.statSync(filename).size,
		/**
		 * byte counter. 已經處理過的資料長度，為 bytes，非 characters。指向 buffer 起頭在 file
		 * 中的位置。
		 * 
		 * @type {ℕ⁰:Natural+0}
		 */
		bytes = 0;
		// 若是預設 encoding，會造成 chunk.length 無法獲得正確的值。
		// 若是為了能掌握進度，則不預設 encoding。
		// 2016/3/26: 但這會造成破碎/錯誤的編碼，只好放棄。
		file_stream.setEncoding(encoding);

		file_stream.on('error', options.onerror || function(error) {
			library_namespace.error('read_dump: Error occurred: ' + error);
		});

		/**
		 * 工作流程: 循序讀取檔案內容。每次讀到一個區塊/段落 (chunk)，檢查是不是有結束標記。若是沒有，則得繼續讀下去。<br />
		 * 有結束標記，則取出開始標記至結束標記中間之頁面文字資料，紀錄起始與結尾檔案位置，放置於 anchor[pageid]，並開始解析頁面。<br />
		 * 此時 bytes 指向檔案中 start position of buffer，可用來設定錨/定位點。
		 */

		library_namespace.info('read_dump: Starting read data...');

		/**
		 * Parse Wikimedia dump xml file slice.
		 * 
		 * TODO: 把工具函數寫到 application.platform.nodejs 裡面去。
		 */
		function parse_buffer(index) {
			index = buffer.indexOf(end_mark, index);
			if (index === NOT_FOUND)
				// 資料尚未完整，繼續讀取。
				return;

			// 回頭找 start mark '<page>'
			var start_index = buffer.lastIndexOf('<page>', index);
			if (start_index === NOT_FOUND) {
				throw new Error(
						'parse_buffer: We have end mark without start mark!');
			}

			var page_data = parse_dump_xml(buffer, start_index, filter);
			if (!page_data) {
				if (false)
					library_namespace.debug(
					//
					'跳過此筆紀錄。 index: ' + index + ', buffer: ' + buffer.length,
							3, 'parse_dump_xml');
				bytes += Buffer.byteLength(buffer.slice(0, index
						+ end_mark.length), encoding);
				// 截斷。
				buffer = buffer.slice(index + end_mark.length);
				// 雖然跳過此筆紀錄，但既然還能處理，便需要繼續處理。
				return true;
			}

			var pageid = page_data.pageid,
			//
			start_pos = Buffer.byteLength(buffer.slice(0, start_index),
					encoding),
			// 犧牲效能以確保採用無須依賴 encoding 特性之實作法。
			page_bytes = Buffer.byteLength(buffer.slice(start_index, index
					+ end_mark.length), encoding),
			// [ start position of file, length in bytes ]
			page_anchor = [ bytes + start_pos, page_bytes ];
			if (false && anchor && (pageid in anchor))
				library_namespace.error('parse_buffer: Duplicated page id: '
						+ pageid);
			if (anchor)
				anchor[pageid] = page_anchor;
			// 跳到下一筆紀錄。
			bytes += start_pos + page_bytes;
			// 截斷。
			buffer = buffer.slice(index + end_mark.length);

			if (wiki_API.quit_operation ===
			/**
			 * function({Object}page_data, {Natural}position: 到本page結束時之檔案位置,
			 * {Array}page_anchor)
			 */
			callback(page_data, bytes, page_anchor/* , file_status */)) {
				// console.log(file_stream);
				library_namespace.info('read_dump: Quit operation, 中途跳出作業...');
				file_stream.end();
				// Release memory. 釋放被占用的記憶體.
				buffer = null;
				run_last(true);
				return;
			}

			return true;
		}

		file_stream.on('data', function(chunk) {

			// 之前的 buffer 已經搜尋過，不包含 end_mark。
			var index = buffer.length;

			/**
			 * 當未採用 .setEncoding(encoding)，之後才 += chunk.toString(encoding)；
			 * 則一個字元可能被切分成兩邊，這會造成破碎/錯誤的編碼。
			 * 
			 * This properly handles multi-byte characters that would otherwise
			 * be potentially mangled if you simply pulled the Buffers directly
			 * and called buf.toString(encoding) on them. If you want to read
			 * the data as strings, always use this method.
			 * 
			 * @see https://nodejs.org/api/stream.html#stream_class_stream_readable
			 */
			buffer += chunk;
			// buffer += chunk.toString(encoding);

			// --------------------------------------------

			/**
			 * 以下方法廢棄 deprecated。 an alternative method: 另一個方法是不設定
			 * file_stream.setEncoding(encoding)，而直接搜尋 buffer 有無 end_mark '</page>'。直到確認不會打斷
			 * character，才解 Buffer。若有才分割、執行 .toString(encoding)。但這需要依賴最終
			 * encoding 之特性，並且若要採 Buffer.concat() 也不見得更高效， and
			 * Buffer.prototype.indexOf() needs newer node.js. 或許需要自己寫更底層的功能，直接
			 * call fs.read()。此外由於測試後，發現瓶頸在網路傳輸而不在程式碼執行，因此不如犧牲點效能，確保採用無須依賴
			 * encoding 特性之實作法。
			 */

			;

			// --------------------------------------------
			while (parse_buffer(index))
				// 因為 buffer 已經改變，reset index.
				index = 0;

			// 頁面大小系統上限 2,048 KB = 2 MB。
			if (buffer.length > 3e6) {
				library_namespace.error(
				//
				'read_dump: buffer too long (' + buffer.length
						+ ' characters)! Paused! 有太多無法處理的 buffer，可能是格式錯誤？');
				console.log(buffer.slice(0, 1e3) + '...');
				file_stream.pause();
				// file_stream.resume();
				// throw buffer.slice(0,1e3);
			}
		});

		file_stream.on('end', run_last);

		// * @returns {String}file path
		// * @returns {node_fs.ReadStream}file handler
		// return file_stream;
	}

	wiki_API.read_dump = read_dump;

	// ------------------------------------------------------------------------

	/**
	 * cache 相關函數:
	 * 
	 * @see application.storage.file.get_cache_file
	 *      application.OS.Windows.file.cacher
	 *      application.net.Ajax.get_URL_cache<br />
	 *      application.net.wiki<br />
	 *      wiki_API.cache() CeL.wiki.cache()
	 */

	if (false) {
		// examples

		CeL.wiki.cache({
			type : 'page',
			file_name : 'file_name',
			list : 'WP:SB',
			operator : function(data) {
				console.log(data);
			}
		}, function callback(data) {
			console.log(data);
		}, {
			// default options === this
			// namespace : '0|1',
			// [KEY_SESSION]
			// session : wiki,
			// title_prefix : 'Template:',
			// cache path prefix
			prefix : 'base_directory/'
		});

		CeL.set_debug(6);
		CeL.wiki.cache({
			type : 'callback',
			file_name : 'file_name',
			list : function(callback) {
				callback([ 1, 2, 3 ]);
			},
			operator : function(data) {
				console.log(data);
			}
		}, function callback(data) {
			console.log(data);
		}, {
			// default options === this
			// namespace : '0|1',
			// [KEY_SESSION]
			// session : wiki,
			// title_prefix : 'Template:',
			// cache path prefix
			prefix : './'
		});

		CeL.set_debug(6);
		var wiki = Wiki(true);
		CeL.wiki.cache({
			type : 'wdq',
			file_name : 'countries',
			list : 'claim[31:6256]',
			operator : function(list) {
				// console.log(list);
				result = list;
			}
		}, function callback(list) {
			// console.log(list);
		}, {
			// default options === this
			// namespace : '0|1',
			// [KEY_SESSION]
			session : wiki,
			// title_prefix : 'Template:',
			// cache path prefix
			prefix : './'
		});
	}

	/**
	 * cache 作業操作之輔助套裝函數。
	 * 
	 * 注意: only for node.js. 必須自行 include 'application.platform.nodejs'。 <code>
	   CeL.run('application.platform.nodejs');
	 * </code><br />
	 * 注意: 需要自行先創建各 type 之次目錄，如 page, redirects, embeddedin, ...<br />
	 * 注意: 會改變 operation, _this！ Warning: will modify operation, _this!
	 * 
	 * 連續作業: 依照 _this 設定 {Object}default options，即傳遞於各 operator 間的 ((this))。<br />
	 * 依照 operation 順序個別執行單一項作業。
	 * 
	 * 單一項作業流程:<br />
	 * 設定檔名。<br />
	 * 若不存在此檔，則:<br />
	 * >>> 依照 operation.type 與 operation.list 取得資料。<br />
	 * >>> 若 Array.isArray(operation.list) 則處理多項列表作業:<br />
	 * >>>>>> 個別處理單一項作業，每次執行 operation.each() || operation.each_retrieve()。<br />
	 * >>> 執行 data = operation.retrieve(data)，以其回傳作為將要 cache 之 data。<br />
	 * >>> 寫入cache。<br />
	 * 執行 operation.operator(data)
	 * 
	 * TODO: file_stream<br />
	 * TODO: do not write file
	 * 
	 * @param {Object|Array}operation
	 *            作業設定。
	 * @param {Function}[callback]
	 *            所有作業(operation)執行完後之回調函數。 callback(response data)
	 * @param {Object}[_this]
	 *            傳遞於各 operator 間的 ((this))。注意: 會被本函數更動！
	 */
	wiki_API.cache = function(operation, callback, _this) {
		if (library_namespace.is_Object(callback) && !_this) {
			// 未設定/不設定 callback
			// shift arguments.
			_this = callback;
			callback = undefined;
		}

		var index = 0;
		/**
		 * 連續作業時，轉到下一作業。
		 * 
		 * node.js v0.11.16: In strict mode code, functions can only be declared
		 * at top level or immediately within another function.
		 */
		function next_operator(data) {
			library_namespace.debug('處理連續作業序列，轉到下一作業: ' + (index + 1) + '/'
					+ operation.length, 2, 'wiki_API.cache.next_operator');
			// [ {Object}operation, {Object}operation, ... ]
			// operation = { type:'embeddedin', operator:function(data) }
			if (index < operation.length) {
				var this_operation = operation[index++];
				// console.log(this_operation);
				if (!this_operation) {
					// Allow null operation.
					library_namespace.debug('未設定 operation[' + (index - 1)
							+ ']。Skip this operation.', 1,
							'wiki_API.cache.next_operator');
					next_operator(data);

				} else {
					if (!('list' in this_operation)) {
						// use previous data as list.
						library_namespace.debug(
								'未特別指定 list，以前一次之回傳 data 作為 list。', 3,
								'wiki_API.cache.next_operator');
						library_namespace.debug('前一次之回傳 data: '
								+ (data && JSON.stringify(data).slice(0, 180))
								+ '...', 3, 'wiki_API.cache.next_operator');
						this_operation.list = data;
					}
					if (data) {
						library_namespace.debug('設定 .last_data_got: '
								+ (data && JSON.stringify(data).slice(0, 180))
								+ '...', 3, 'wiki_API.cache.next_operator');
						this_operation.last_data_got = data;
					}
					// default options === _this: 傳遞於各 operator 間的 ((this))。
					wiki_API.cache(this_operation, next_operator, _this);
				}

			} else if (typeof callback === 'function') {
				if (false && Array.isArray(data)) {
					// TODO: adapt to {Object}operation
					library_namespace.log('wiki_API.cache: Get ' + data.length
							+ ' page(s).');
					// 自訂list
					// data = [ '' ];
					if (_this.limit >= 0) {
						// 設定此初始值，可跳過之前已經處理過的。
						data = data.slice(0 * _this.limit, 1 * _this.limit);
					}
					library_namespace.debug(data.slice(0, 8).map(
					//
					function(page_data) {
						return get_page_title(page_data);
					}).join('\n') + '\n...');
				}

				// last 收尾
				callback.call(_this, data);
			}
		}

		if (Array.isArray(operation)) {
			next_operator();
			return;
		}

		// ----------------------------------------------------
		/**
		 * 以下為處理單一次作業。
		 */
		library_namespace.debug('處理單一次作業。', 2, 'wiki_API.cache');
		library_namespace.debug(
				'using operation: ' + JSON.stringify(operation), 6,
				'wiki_API.cache');

		if (typeof _this !== 'object') {
			// _this: 傳遞於各 operator 間的 ((this))。
			_this = Object.create(null);
		}

		var file_name = operation.file_name,
		/** 前一次之回傳 data。每次產出的 data。 */
		last_data_got = operation.last_data_got;

		if (typeof file_name === 'function') {
			// @see wiki_API.cache.title_only
			file_name = file_name.call(_this, last_data_got, operation);
		}

		var
		/** {String}method to get data */
		type = operation.type,
		/** {Boolean}是否自動嘗試建立目錄。 */
		try_mkdir = typeof library_namespace.fs_mkdir === 'function'
				&& operation.mkdir,
		//
		operator = typeof operation.operator === 'function'
				&& operation.operator,
		//
		list = operation.list;

		if (!file_name) {
			// 若自行設定了檔名，則慢點執行 list()，先讀讀 cache。因為 list() 可能會頗耗時間。
			// 基本上，設定 this.* 應該在 operation.operator() 中，而不是在 operation.list() 中。
			if (typeof list === 'function') {
				// TODO: 允許非同步方法。
				list = list.call(_this, last_data_got, operation);
			}

			if (!operation.postfix)
				if (type === 'file')
					operation.postfix = '.txt';
				else if (type === 'URL')
					operation.postfix = '.htm';

			// 自行設定之檔名 operation.file_name 優先度較 type/title 高。
			// 需要自行創建目錄！
			file_name = _this[type + '_prefix'] || type;
			file_name = [ file_name
			// treat file_name as directory
			? /[\\\/]/.test(file_name) ? file_name : file_name + '/' : '',
			//
			get_page_content.is_page_data(list) ? list.title
			// 若 Array.isArray(list)，則 ((file_name = ''))。
			: typeof list === 'string' && normalize_page_name(list, true) ];
			if (file_name[1]) {
				file_name = file_name[0]
				// 正規化檔名。
				+ file_name[1].replace(/\//g, '_');
			} else {
				// assert: node_fs.readFile('') 將執行 callback(error)
				file_name = '';
			}
		}

		if (file_name) {
			if (!('postfix' in operation) && !('postfix' in _this)
					&& /\.[a-z\d\-]+$/i.test(file_name)) {
				// 若已設定 filename extension，則不自動添加。
				operation.postfix = '';
			}

			file_name = [ 'prefix' in operation ? operation.prefix
			// _this.prefix: cache path prefix
			: 'prefix' in _this
			//
			? _this.prefix : wiki_API.cache.prefix, file_name,
			// auto detect filename extension
			'postfix' in operation ? operation.postfix
			//
			: 'postfix' in _this ? _this.postfix : wiki_API.cache.postfix ];
			library_namespace.debug('Pre-normalized cache file name: ['
					+ file_name + ']', 5, 'wiki_API.cache');
			if (false)
				library_namespace.debug('file name param:'
						+ [ operation.file_name, _this[type + '_prefix'], type,
								JSON.stringify(list) ].join(';'), 6,
						'wiki_API.cache');
			// 正規化檔名。
			file_name = file_name.join('').replace(/[:*?<>]/g, '_');
		}
		library_namespace.debug('Try to read cache file: [' + file_name + ']',
				3, 'wiki_API.cache');

		var
		/**
		 * 採用 JSON<br />
		 * TODO: parse & stringify 機制
		 * 
		 * @type {Boolean}
		 */
		use_JSON = 'json' in operation ? operation.json : /\.json$/i
				.test(file_name),
		/** {String}file encoding for fs of node.js. */
		encoding = _this.encoding || wiki_API.encoding;
		// list file path
		_this.file_name = file_name;

		// console.log('Read file: ' + file_name);
		node_fs.readFile(file_name, encoding, function(error, data) {
			/**
			 * 結束作業。
			 */
			function finish_work(data) {
				library_namespace.debug('finish work', 3,
						'wiki_API.cache.finish_work');
				last_data_got = data;
				if (operator)
					operator.call(_this, data, operation);
				library_namespace.debug('loading callback', 3,
						'wiki_API.cache.finish_work');
				if (typeof callback === 'function')
					callback.call(_this, data);
			}

			if (!operation.reget && !error && (data ||
			// 當資料 Invalid，例如採用 JSON 卻獲得空資料時；則視為 error，不接受此資料。
			('accept_empty_data' in _this
			//
			? _this.accept_empty_data : !use_JSON))) {
				library_namespace.debug('Using cached data.', 3,
						'wiki_API.cache');
				library_namespace.debug('Cached data: ['
						+ (data && data.slice(0, 200)) + ']...', 5,
						'wiki_API.cache');
				if (use_JSON && data) {
					try {
						data = JSON.parse(data);
					} catch (e) {
						library_namespace.error(
						// error. e.g., "undefined"
						'wiki_API.cache: Can not parse as JSON: ' + data);
						// 注意: 若中途 abort，此時可能需要手動刪除大小為 0 的 cache file！
						data = undefined;
					}
				}
				finish_work(data);
				return;
			}

			library_namespace.debug(
					operation.reget ? 'Dispose cache. Reget again.'
					// ↑ operation.reget: 放棄 cache，重新取得資料。
					: 'No valid cached data. Try to get data...', 3,
					'wiki_API.cache');

			/**
			 * 寫入 cache 至檔案系統。
			 */
			function write_cache(data) {
				if (operation.cache === false) {
					// 當設定 operation.cache: false 時，不寫入 cache。
					library_namespace.debug(
							'設定 operation.cache === false，不寫入 cache。', 3,
							'wiki_API.cache.write_cache');
				} else if (/[^\\\/]$/.test(file_name)) {
					library_namespace
							.info('wiki_API.cache: Write cache data to ['
									+ file_name + '].');
					library_namespace.debug('Cache data: '
							+ (data && JSON.stringify(data).slice(0, 190))
							+ '...', 3, 'wiki_API.cache.write_cache');
					var write = function() {
						// 為了預防需要建立目錄，影響到後面的作業，
						// 因此採用 fs.writeFileSync() 而非 fs.writeFile()。
						node_fs.writeFileSync(file_name, use_JSON ? JSON
								.stringify(data) : data, encoding);
					};
					try {
						write();
					} catch (error) {
						// assert: 此 error.code 表示上層目錄不存在。
						var matched = error.code === 'ENOENT'
						// 未設定 operation.mkdir 的話，預設會自動嘗試建立目錄。
						&& try_mkdir !== false
						//
						&& file_name.match(/[\\\/][^\\\/]+$/);
						if (matched) {
							// 僅測試一次。設定 "已嘗試過" flag。
							try_mkdir = false;
							// create parent directory
							library_namespace.fs_mkdir(file_name.slice(0,
									matched.index));
							// re-write file again.
							try {
								write();
							} catch (e) {
								library_namespace.error(
								//
								'wiki_API.cache: Error to write cache data!');
								library_namespace.error(e);
							}
						}
					}
				}

				finish_work(data);
			}

			// node.js v0.11.16: In strict mode code, functions can only be
			// declared
			// at top level or immediately within another function.
			/**
			 * 取得並處理下一項 data。
			 */
			function get_next_item(data) {
				library_namespace.debug('處理多項列表作業: ' + (index + 1) + '/'
						+ list.length, 2, 'wiki_API.cache.get_next_item');
				if (index < list.length) {
					// 利用基本相同的參數以取得 cache。
					_operation.list = list[index++];
					wiki_API.cache(_operation, get_next_item, _this);
				} else {
					// last 收尾
					// All got. retrieve data.
					if (_operation.data_list)
						data = _operation.data_list;
					if (typeof operation.retrieve === 'function')
						data = operation.retrieve.call(_this, data);
					write_cache(data);
				}
			}

			if (typeof list === 'function' && type !== 'callback') {
				library_namespace.debug('Call .list()', 3, 'wiki_API.cache');
				list = list.call(_this, last_data_got, operation);
				// 對於 .list() 為 asynchronous 函數的處理。
				if (list === wiki_API.cache.abort) {
					library_namespace.debug('It seems the .list()'
							+ ' is an asynchronous function.' + ' I will exit'
							+ ' and wait for the .list() finished.', 3,
							'wiki_API.cache');
					return;
				}
			}
			if (list === wiki_API.cache.abort) {
				library_namespace
						.debug('Abort operation.', 1, 'wiki_API.cache');
				finish_work();
				return;
			}

			if (Array.isArray(list)) {
				if (!type) {
					library_namespace.debug('採用 list (length ' + list.length
							+ ') 作為 data。', 1, 'wiki_API.cache');
					write_cache(list);
					return;
				}
				if (list.length > 1e6) {
					library_namespace.warn(
					//
					'wiki_API.cache: 警告: list 過長/超過限度 (length ' + list.length
							+ ')，將過於耗時而不實際！');
				}

				/**
				 * 處理多項列表作業。
				 */
				var index = 0, _operation = Object.clone(operation);
				// 個別頁面不設定 .file_name, .end。
				delete _operation.end;
				if (_operation.each_file_name) {
					_operation.file_name = _operation.each_file_name;
					delete _operation.each_file_name;
				} else {
					delete _operation.file_name;
				}
				if (typeof _operation.each === 'function') {
					// 每一項 list 之項目執行一次 .each()。
					_operation.operator = _operation.each;
					delete _operation.each;
				} else {
					if (typeof _operation.each_retrieve === 'function')
						_operation.each_retrieve = _operation.each_retrieve
								.bind(_this);
					else
						delete _operation.each_retrieve;
					/**
					 * 預設處理列表的函數。
					 */
					_operation.operator = function(data) {
						if ('each_retrieve' in operation)
							// 資料事後處理程序 (post-processor):
							// 將以 .each_retrieve() 的回傳作為要處理的資料。
							data = operation.each_retrieve.call(_this, data);
						if (_operation.data_list) {
							if (Array.isArray(data))
								Array.prototype.push.apply(
										_operation.data_list, data);
							else if (data)
								_operation.data_list.push(data);
						} else {
							if (Array.isArray(data))
								_operation.data_list = data;
							else if (data)
								_operation.data_list = [ data ];
						}
					};
				}
				library_namespace.debug('處理多項列表作業, using operation: '
						+ JSON.stringify(_operation), 5, 'wiki_API.cache');

				get_next_item();
				return;
			}

			// ------------------------------------------------
			/**
			 * 以下為處理單一項作業。
			 */

			var to_get_data, list_type;
			if (type in get_list.type) {
				list_type = type;
				type = 'list';
			}

			switch (type) {
			case 'callback':
				if (typeof list !== 'function') {
					library_namespace
							.warn('wiki_API.cache: list is not function!');
					callback.call(_this, last_data_got);
					break;
				}
				// 手動取得資料。使用 list=function(callback){callback(list);}
				to_get_data = function(list, callback) {
					library_namespace.log('wiki_API.cache: '
							+ 'manually get data and then callback(list).');
					if (typeof list === 'function') {
						// assert: (typeof list === 'function') 必須自己回 call！
						list.call(_this, callback, last_data_got, operation);
					}
				};
				break;

			case 'file':
				// 一般不應用到。
				// get file 內容。
				to_get_data = function(file_path, callback) {
					library_namespace.log('wiki_API.cache: Get file ['
							+ file_path + '].');
					node_fs.readFile(file_path, operation.encoding, function(
							error, data) {
						if (error)
							library_namespace.error(
							//
							'wiki_API.cache: Error get file [' + file_path
									+ ']: ' + error);
						callback.call(_this, data);
					});
				};
				break;

			case 'URL':
				// get URL 頁面內容。
				to_get_data = function(URL, callback) {
					library_namespace.log('wiki_API.cache: Get URL of [' + URL
							+ '].');
					get_URL(URL, callback);
				};
				break;

			case 'wdq':
				to_get_data = function(query, callback) {
					if (_this[KEY_SESSION]) {
						if (!_this[KEY_SESSION].data_session) {
							_this[KEY_SESSION].set_data();
							_this[KEY_SESSION].run(function() {
								// retry again
								to_get_data(query, callback);
							});
							return;
						}
						operation[KEY_SESSION]
						//
						= _this[KEY_SESSION].data_session;
					}

					library_namespace.log('wiki_API.cache: Wikidata Query ['
							+ query + '].');
					wikidata_query(query, callback, operation);
				};
				break;

			case 'page':
				// get page contents 頁面內容。
				// title=(operation.title_prefix||_this.title_prefix)+operation.list
				to_get_data = function(title, callback) {
					library_namespace.log('wiki_API.cache: Get content of '
							+ get_page_title_link(title));
					wiki_API.page(title, function(page_data) {
						callback(page_data);
					}, library_namespace.new_options(_this, operation));
				};
				break;

			case 'redirects':
				// 取得所有重定向到(title重定向標的)之頁面列表，(title重定向標的)將會排在[0]。
				// 注意: 無法避免雙重重定向問題!
				to_get_data = function(title, callback) {
					// wiki_API.redirects(title, callback, options)
					wiki_API.redirects(title, function(root_page_data,
							redirect_list) {
						if (!operation.keep_redirects && redirect_list
								&& redirect_list[0])
							// cache 中不需要此累贅之資料。
							// redirect_list[0].redirects
							// === redirect_list.slice(1)
							delete redirect_list[0].redirects;
						callback(redirect_list);
					}, Object.assign({
						include_root : true
					}, _this, operation));
				};
				break;

			case 'list':
				to_get_data = function(title, callback) {
					wiki_API.list(title, function(pages) {
						library_namespace.log(list_type
						// allpages 不具有 title。
						+ (title ? ' ' + get_page_title_link(title) : '')
						//
						+ ': ' + pages.length + ' page(s).');
						pages.query_title = title;
						// page list, title page_data
						callback(pages);
					}, Object.assign({
						type : list_type
					}, _this, operation));
				};
				break;

			default:
				if (typeof type === 'function')
					to_get_data = type.bind(Object.assign(Object.create(null),
							_this, operation));
				else if (type)
					throw new Error('wiki_API.cache: Bad type: ' + type);
				else {
					library_namespace.debug('直接採用 list 作為 data。', 1,
							'wiki_API.cache');
					write_cache(list);
					return;
				}
			}

			// 回復 recover type
			// if (list_type) type = list_type;

			var title = list;

			if (typeof title === 'string') {
				// 可以用 operation.title_prefix 覆蓋 _this.title_prefix
				if ('title_prefix' in operation) {
					if (operation.title_prefix)
						title = operation.title_prefix + title;
				} else if (_this.title_prefix)
					title = _this.title_prefix + title;
			}
			library_namespace.debug('處理單一項作業: ' + get_page_title_link(title)
					+ '。', 3, 'wiki_API.cache');
			to_get_data(title, write_cache);
		});
	};

	/** {String}預設 file encoding for fs of node.js。 */
	wiki_API.encoding = 'utf8';
	/** {String}檔名預設前綴。 */
	wiki_API.cache.prefix = '';
	/** {String}檔名預設後綴。 */
	wiki_API.cache.postfix = '.json';
	/**
	 * 若 operation.list() return wiki_API.cache.abort，<br />
	 * 則將直接中斷離開 operation，不執行 callback。<br />
	 * 此時須由 operation.list() 自行處理 callback。
	 */
	wiki_API.cache.abort = {
		cache : 'abort'
	};
	/**
	 * 只取檔名，僅用在 operation.each_file_name。<br />
	 * <code>{
	 * each_file_name : CeL.wiki.cache.title_only,
	 * }</code>
	 * 
	 * @type {Function}
	 */
	wiki_API.cache.title_only = function(last_data_got, operation) {
		var list = operation.list;
		if (typeof list === 'function') {
			operation.list = list = list.call(this, last_data_got, operation);
		}
		return operation.type + '/' + remove_namespace(list);
	};

	// --------------------------------------------------------------------------------------------

	if (false) {
		(function() {
			/**
			 * usage of revision_cacher()
			 */

			var
			/** {revision_cacher}記錄處理過的文章。 */
			processed_data = new CeL.wiki.revision_cacher(base_directory
					+ 'processed.' + use_language + '.json');

			function for_each_page(page_data) {
				// Check if page_data had processed useing revid.
				if (processed_data.had(page_data)) {
					// skipped_count++;
					return [ CeL.wiki.edit.cancel, 'skip' ];
				}

				// 在耗費資源的操作後，登記已處理之 title/revid。其他為節省空間，不做登記。
				// 初始化本頁之 processed data: 只要處理過，無論成功失敗都作登記。
				var data_to_cache = processed_data.data_of(page_data);
				// or:
				// 注意: 只有經過 .data_of() 的才造出新實體。
				// 因此即使沒有要取得資料，也需要呼叫一次 .data_of() 以造出新實體、登記 page_data 之 revid。
				processed_data.data_of(page_data);
				processed_data.data_of(title, revid);

				// page_data is new than processed data

				// main task...

				// 成功才登記。失敗則下次重試。
				processed_data.remove(title);

				// 可能中途 killed, crashed，因此尚不能 write_processed()，
				// 否則會把 throw 的當作已處理過。
			}

			function finish_work() {
				// 由於造出 data 的時間過長，可能丟失 token，
				// 因此將 processed_data 放在 finish_work() 階段。
				processed_data.renew();
			}

			function onfail() {
				// 確保沒有因特殊錯誤產生的漏網之魚。
				titles.unique().forEach(processed_data.remove, processed_data);
			}

			// Finally: Write to cache file.
			processed_data.write();
		})();
	}

	/**
	 * 記錄處理過的文章。
	 * 
	 * @param {String}cache_file_path
	 *            記錄處理過的文章。
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * 
	 * @constructor
	 */
	function revision_cacher(cache_file_path, options) {
		this.read(cache_file_path, options);
	}

	revision_cacher.prototype = {
		KEY_DATA : 'data',
		// id or 'revid'
		KEY_ID : 'id',
		encoding : wiki_API.encoding,
		// 連續跳過超過此頁面數 .show_skip 則會顯示訊息。
		show_skip : 9,

		// renew cache data
		renew : function() {
			// Object.create(null)
			this[this.KEY_DATA] = {};
		},
		read : function(cache_file_path, options) {
			if (typeof cache_file_path === 'object' && !options) {
				options = cache_file_path;
				cache_file_path = options.file;
			}
			if (cache_file_path) {
				this.file = cache_file_path;
			}

			var setup_new;
			if (options === true) {
				setup_new = false;
				options = {
					// Do NOT discard old data, use the old one.
					// 保存舊資料不廢棄。
					// 為了預防 this[this.KEY_DATA] 肥大，一般應將舊資料放在 this.cached，
					// 本次新處理的才放在 this[this.KEY_DATA]。
					preserve : true
				};
			} else {
				options = library_namespace.setup_options(options);
				setup_new = !options.preserve;
			}

			// this.options = options;

			// for .id_only, .KEY_ID, .encoding, .show_skip
			Object.assign(this, options);

			// reset skipped_count
			// this.skipped = 0;
			// 連續跳過計數。
			if (this.show_skip > 0) {
				this.continuous_skip = 0;
			}

			/**
			 * {Object}舊資料/舊結果報告。
			 * 
			 * cached_data[local page title] = { this.KEY_ID : 0,
			 * user_defined_data }
			 * 
			 * if set .id_only, then:<br />
			 * cached_data[local page title] = {Natural}revid<br />
			 * 這可進一步減少空間消耗。cached_data cache 已經處理完成操作的 data，但其本身可能也會占用一些以至大量RAM。
			 */
			var cached_data;
			try {
				cached_data = node_fs.readFileSync(cache_file_path,
						this.encoding);
			} catch (e) {
				// nothing get.
			}
			cached_data = cached_data && JSON.parse(cached_data) || {};
			this.cached = cached_data;

			if (setup_new) {
				Object.seal(cached_data);
				this.renew();
			} else {
				// this[this.KEY_DATA]: processed data
				this[this.KEY_DATA] = cached_data;
			}
		},
		write : function(cache_file_path, callback) {
			node_fs.writeFile(cache_file_path || this.file, JSON
					.stringify(this[this.KEY_DATA]), this.encoding, function(
					error) {
				// 因為此動作一般說來不會影響到後續操作，因此採用同時執行。
				library_namespace.debug('Write to cache file: done.', 1,
						'revision_cacher.write');
				if (typeof callback === 'function')
					callback(error);
			});
			return;

			node_fs.writeFileSync(cache_file_path || this.file, JSON
					.stringify(this[this.KEY_DATA]), this.encoding);
			library_namespace.debug('Write to cache file: done.', 1,
					'revision_cacher.write');
			if (typeof callback === 'function')
				callback(error);
		},

		// 注意: 若未 return true，則表示 page_data 為正規且 cache 中沒有，或較 cache 新的頁面資料。
		had : function(page_data) {
			// page_data 為正規?
			if (!page_data || ('missing' in page_data)) {
				// error? 此頁面不存在/已刪除。
				return 'missing';
			}

			var
			/** {String}page title = page_data.title */
			title = get_page_title(page_data),
			/** {Natural}所取得之版本編號。 */
			revid = get_page_content.revision(page_data);
			if (revid) {
				revid = revid.revid;
			}

			// console.log(CeL.wiki.content_of(page_data));

			library_namespace.debug(get_page_title_link(title) + ' revid '
					+ revid, 4, 'revision_cacher.had');
			if (title in this.cached) {
				var this_data = this[this.KEY_DATA], setup_new = this_data !== this.cached,
				//
				cached = this.cached[title], cached_revid = this.id_only ? cached
						: cached[this.KEY_ID];
				library_namespace.debug(get_page_title_link(title)
						+ ' cached revid ' + cached_revid, 4,
						'revision_cacher.had');
				if (cached_revid === revid) {
					if (setup_new) {
						// copy old data.
						// assert: this_data[title] is modifiable.
						this_data[title] = cached;
					}
					// this.skipped++;
					this.continuous_skip++;
					library_namespace.debug('Skip ' + this.continuous_skip
							+ ': ' + get_page_title_link(title) + ' revid '
							+ revid, 2, 'revision_cacher.had');
					return true;
				}
				// assert: cached_revid < revid
				// rebuild data
				if (setup_new) {
					delete this_data[title];
				}
				// 因為要顯示連續跳過計數資訊，因此不先跳出。
				// return false;
			}

			if (this.continuous_skip > 0) {
				if (this.continuous_skip > this.show_skip) {
					library_namespace.debug(
					// 實際運用時，很少會到這邊。
					'Skip ' + this.continuous_skip + ' pages.', 1,
							'revision_cacher.had');
				}
				this.continuous_skip = 0;
			}
		},
		// 注意: 只有經過 .data_of() 的才造出新實體。
		// 因此即使沒有要取得資料，也需要呼叫一次 .data_of() 以造出新實體、登記 page_data 之 revid。
		data_of : function(page_data, revid) {
			var this_data = this[this.KEY_DATA],
			/** {String}page title = page_data.title */
			title = typeof page_data === 'string' ? page_data
					: get_page_title(page_data);

			if (title in this_data) {
				return this_data[title];
			}

			// 登記 page_data 之 revid。
			if (!revid && (!(revid = get_page_content.revision(page_data))
			/** {Natural}所取得之版本編號。 */
			|| !(revid = revid.revid))) {
				library_namespace.error(
				// 照理來說，會來到這裡的都應該是經過 .had() 確認，因此不該出現此情況。
				'revision_cacher.data_of: No revision id (.revid): ('
						+ (typeof page_data) + ') '
						+ JSON.stringify(page_data).slice(0, 800));
				return;
			}

			if (this.id_only) {
				// 注意: 這個時候回傳的不是 {Object}
				return this_data[title] = revid;
			}

			/** {Object}本頁之 processed data。 */
			var data = this_data[title] = {};
			data[this.KEY_ID] = revid;
			return data;
		},
		remove : function(page_data) {
			var this_data = this[this.KEY_DATA],
			/** {String}page title = page_data.title */
			title = typeof page_data === 'string' ? page_data
					: get_page_title(page_data);

			if (title in this_data) {
				delete this_data[title];
			}
		}
	};

	// --------------------------------------------------------------------------------------------

	/**
	 * 由 Wikimedia Toolforge 上的 database replication 讀取所有 ns0，且未被刪除頁面最新修訂版本之版本編號
	 * rev_id (包含重定向)。<br />
	 * 從 `page` 之 page id 確認 page 之 namespace，以及未被刪除。然後選擇其中最大的 revision id。
	 * 
	 * .i: page id, .r: revision id
	 * 
	 * @type {String}
	 * 
	 * @see https://www.mediawiki.org/wiki/Manual:Page_table#Sample_MySQL_code
	 *      https://phabricator.wikimedia.org/diffusion/MW/browse/master/maintenance/tables.sql
	 */
	var all_revision_SQL = 'SELECT `rev_page` AS i, MAX(`rev_id`) AS r FROM `revision` INNER JOIN `page` ON `page`.`page_id` = `revision`.`rev_page` WHERE `page`.`page_namespace` = 0 AND `revision`.`rev_deleted` = 0 GROUP BY `rev_page`';

	if (false) {
		/**
		 * 採用此 SQL 之極大問題: page.page_latest 並非最新 revision id.<br />
		 * the page.page_latest is not the latest revision id of a page in
		 * Wikimedia Toolforge database replication.
		 */
		all_revision_SQL = 'SELECT `page_id` AS i, `page_latest` AS l FROM `page` p INNER JOIN `revision` r ON p.page_latest = r.rev_id WHERE `page_namespace` = 0 AND r.rev_deleted = 0';
	}
	if (false) {
		// for debug.
		all_revision_SQL += ' LIMIT 8';
	}

	/**
	 * 應用功能: 遍歷所有頁面。 CeL.wiki.traversal()
	 * 
	 * TODO: 配合 revision_cacher，進一步加快速度。
	 * 
	 * @param {Object}[config]
	 *            configuration
	 * @param {Function}callback
	 *            回調函數。 callback(page_data)
	 */
	function traversal_pages(config, callback) {
		if (typeof config === 'function' && callback === undefined) {
			// shift arguments.
			callback = config;
			config = Object.create(null);
		} else {
			// 正規化並提供可隨意改變的同內容參數，以避免修改或覆蓋附加參數。
			config = library_namespace.new_options(config);
		}

		if (config.use_dump) {
			library_namespace.debug(
					'use dump only: 僅僅使用 dump，不採用 API 取得最新頁面內容。', 1,
					'traversal_pages');
			// @see process_dump.js
			if (config.use_dump === true) {
				// 這邊的 ((true)) 僅表示要使用，並採用預設值；不代表設定 dump file path。
				config.use_dump = null;
			}
			read_dump(config.use_dump, callback, {
				// 一般來說只會用到 config.last，將在本函數中稍後執行，
				// 因此先不開放 config.first, config.last。

				// options.first(filename) of read_dump()
				// first : config.first,

				// options.last.call(file_stream, anchor, quit_operation)
				// of read_dump()
				// last : config.last,

				// directory to restore dump files.
				// 指定 dump file 放置的 directory。
				// e.g., '/shared/cache/', '/shared/dumps/', '~/dumps/'
				// https://wikitech.wikimedia.org/wiki/Help:Tool_Labs/Developing#Using_the_shared_Pywikibot_files_.28recommended_setup.29
				// /shared/: shared files
				directory : config.dump_directory
			});
			return;
		}

		/** {Array}id/title list */
		var id_list, rev_list,
		//
		use_language = wikidata_get_site(config, true)
		// else use default_language
		|| default_language,
		/** {Object}用在 wiki_API.cache 之 configuration。 */
		cache_config = {
			// all title/id list
			file_name : config.file_name
			// all_pages.*.json 存有當前語言維基百科當前所有的頁面id以及最新版本 (*:當前語言)
			|| traversal_pages.list_file + '.' + use_language + '.json',
			operator : function(list) {
				if (!Array.isArray(list)) {
					throw 'traversal_pages: No list get!';
				}
				if (list.length === 3
						&& JSON.stringify(list[0]) === JSON
								.stringify(traversal_pages.id_mark)) {
					library_namespace.info(
					// cache file 內容來自 The production replicas (database)，
					// 為經過 cache_config.list 整理過之資料。
					'traversal_pages: 此資料似乎為 page id，來自 production replicas: ['
							+ this.file_name + ']');
					// Skip list[0] = traversal_pages.id_mark
					rev_list = list[2];
					list = list[1];
					// 讀取 production replicas 時，儲存的是 pageid。
					list.is_id = true;
				}
				id_list = list;
			}
		};

		if (Array.isArray(config.list)) {
			library_namespace.debug('採用輸入之 list，列表長度 ' + config.list.length
					+ '。', 1, 'traversal_pages');
			cache_config.list = config.list;

		} else if (wmflabs && !config.no_database) {
			library_namespace.debug('若沒有 cache，則嘗試讀取 database 之資料。', 1,
					'traversal_pages');
			cache_config.list = function() {
				library_namespace.info(
				// Wikimedia Toolforge database replicas.
				'traversal_pages: 嘗試讀取 Wikimedia Toolforge 上之 database replication 資料，'
						+ '一次讀取完所有頁面最新修訂版本之版本號 rev_id...');
				// default: 採用 page_id 而非 page_title 來 query。
				var is_id = 'is_id' in config ? config.is_id : true;
				run_SQL(is_id ? all_revision_SQL
				//
				: all_revision_SQL.replace(/page_id/g, 'page_title'), function(
						error, rows, fields) {
					if (error) {
						library_namespace.error(error);
						config.no_database = error;
					} else {
						library_namespace.log('traversal_pages: All '
								+ rows.length + ' pages. 轉換中...');
						// console.log(rows.slice(0, 2));
						var id_list = [], rev_list = [];
						rows.forEach(function(row) {
							// .i, .r: @see all_revision_SQL
							id_list.push(is_id ? row.i | 0 : row.i
									.toString('utf8'));
							rev_list.push(row.r);
						});
						config.list = [ traversal_pages.id_mark, id_list,
								rev_list ];
						// config.is_id = is_id;
					}
					// 因為已經取得所有列表，重新呼叫traversal_pages()。
					traversal_pages(config, callback);
				}, config && config.SQL_config
				// 光從 use_language 無法獲得如 wikinews 之資訊。
				|| new_SQL_config(config[KEY_SESSION] || use_language));
				return wiki_API.cache.abort;
			};

		} else {
			library_namespace.debug('採用 API type = allpages。', 1,
					'traversal_pages');
			cache_config.type = 'allpages';
		}

		wiki_API.cache(cache_config,
		// do for each page
		function() {
			// 有設定 config[KEY_SESSION] 才能獲得如 bot 之類，一次讀取/操作更多頁面的好處。
			var session = config[KEY_SESSION]
			//
			|| new wiki_API(config.user, config.password, config.language);
			library_namespace.log('traversal_pages: 開始遍歷 '
			// includes redirection 包含重新導向頁面.
			+ (id_list && id_list.length) + ' pages...');

			/**
			 * 工作原理:<code>

			 * 經測試，讀取 file 會比讀取 MariaDB 快，且又更勝於經 API 取得資料。
			 * 經測試，遍歷 xml dump file 約 3分鐘(see process_dump.js)，會比隨機存取快得多。
			 * database replicas @ Wikimedia Toolforge 無 `text` table，因此實際頁面內容不僅能經過 replicas 存取。

			# 先將最新的 xml dump file 下載到本地(實為 network drive)並解開: read_dump()
			# 由 Wikimedia Toolforge database replication 讀取所有 ns0 且未被刪除頁面最新修訂版本之版本號 rev_id (包含重定向): traversal_pages() + all_revision_SQL
			# 遍歷 xml dump file，若 dump 中為最新修訂版本，則先用之 (約 95%)；純粹篩選約需近 3 minutes: try_dump()
			# 經 API 讀取餘下 dump 後近 5% 更動過的頁面內容: traversal_pages() + wiki_API.prototype.work
			# 於 Wikimedia Toolforge，解開 xml 後；自重新抓最新修訂版本之版本號起，網路連線順暢時整個作業時間約 12分鐘。

			</code>
			 */

			function try_dump() {
				var start_read_time = Date.now(), length = id_list.length,
				// max_length = 0,
				count = 0, limit = config.limit,
				//
				file_size, rev_of_id = [], is_id = id_list.is_id;

				id_list.forEach(function(id, index) {
					if (id in rev_of_id)
						library_namespace.warn('traversal_pages: 存在重複之id: '
								+ id);
					rev_of_id[id] = rev_list[index];
				});

				// Release memory. 釋放被占用的記憶體.
				id_list = rev_list = null;

				if (dump_file === true) {
					// 這邊的 ((true)) 僅表示要使用，並不代表設定 dump file path。
					dump_file = null;
				}
				read_dump(dump_file,
				//
				function(page_data, position, page_anchor) {
					// filter

					// TODO
					if (false && limit > 0 && count > limit) {
						library_namespace.log(count + '筆資料，已到 limit，跳出。');
					}

					if (++count % 1e4 === 0) {
						var speed = count / (Date.now() - start_read_time);
						speed = speed < .1 ? (1e3 * speed).toFixed(2)
								+ ' page/s' : speed.toFixed(3) + ' page/ms';
						// e.g.,
						// "2730000 (99%): 21.326 page/ms [[Category:大洋洲火山岛]]"
						library_namespace.log(
						// 'traversal_pages: ' +
						count + ' ('
						//
						+ (100 * position / file_size | 0) + '%): '
						//
						+ speed + ' ' + get_page_title_link(page_data));
					}

					// ----------------------------
					// Check data.

					if (false) {
						if (!page_data || ('missing' in page_data)) {
							// error? 此頁面不存在/已刪除。
							return [ CeL.wiki.edit.cancel, '條目不存在或已被刪除' ];
						}
						if (page_data.ns !== 0
								&& page_data.title !== 'Wikipedia:サンドボックス') {
							return [ CeL.wiki.edit.cancel,
							// 本作業は記事だけを編集する
							'本作業僅處理條目命名空間或模板或 Category' ];
							throw '非條目:' + get_page_title_link(page_data)
							//
							+ '! 照理來說不應該出現有 ns !== 0 的情況。';
						}

						/** {Object}revision data. 修訂版本資料。 */
						var revision = page_data && page_data.revisions
								&& page_data.revisions[0],
						/** {Natural}所取得之版本編號。 */
						revid = revision && revision.revid;
						revid = page_data && page_data.revisions
								&& page_data.revisions[0]
								&& page_data.revisions[0].revid;

						/** {String}page title = page_data.title */
						var title = CeL.wiki.title_of(page_data),
						/**
						 * {String}page content, maybe undefined. 條目/頁面內容 =
						 * revision['*']
						 */
						content = CeL.wiki.content_of(page_data);

						// 當取得了多個版本:
						// content = CeL.wiki.content_of(page_data, 0);

						// 似乎沒 !page_data.title 這種問題。
						if (false && !page_data.title)
							library_namespace.warn('* No title: [['
									+ page_data.pageid + ']]!');

						// typeof content !== 'string'
						if (!content) {
							return [
									CeL.wiki.edit.cancel,
									'No contents: '
											+ CeL.wiki.title_link_of(page_data)
											// or: 此頁面不存在/已刪除。
											+ '! 沒有頁面內容！' ];
						}

						var last_edit_Date = CeL.wiki.content_of
								.edit_time(page_data);

						// [[Wikipedia:快速删除方针]]
						if (revision['*']) {
							// max_length = Math.max(max_length,
							// revision['*'].length);

							// filter patterns

						} else {
							library_namespace.warn('* No contents: '
									+ CeL.wiki.title_link_of(page_data)
									+ '! 沒有頁面內容！');
						}

						/** 頁面解析後的結構。 */
						var parsed = CeL.wiki.parser(page_data).parse();
						// debug 用.
						// check parser, test if parser working properly.
						if (CeL.wiki.content_of(page_data) !== parsed
								.toString()) {
							console.log(CeL.LCS(CeL.wiki.content_of(page_data),
									parsed.toString(), 'diff'));
							throw 'Parser error: '
									+ CeL.wiki.title_link_of(page_data);
						}

						// using for_each_token()
						parsed.each('link', function(token, index) {
							console.log(token);
						});
					}

					// 註記為 dump。可以 ((messages)) 判斷是在 .work() 中執行或取用 dump 資料。
					// page_data.dump = true;
					// page_data.dump = dump_file;

					// ------------------------------------
					// 有必要中途跳出時則須在 callback() 中設定：
					// @ callback(page_data, messages):
					if (false && need_quit) {
						if (messages) {
							// 當在 .work() 中執行時。
							messages.quit_operation = true;
							// 在 .edit() 時不設定內容。但照理應該會在 .page() 中。
							return;
						}
						// 當在本函數，下方執行時，不包含 messages。
						return CeL.wiki.quit_operation;
					}
					// ------------------------------------

					return callback(page_data);

				}, {
					session : config[KEY_SESSION],
					// directory to restore dump files.
					directory : config.dump_directory,
					// options.first(filename) of read_dump()
					first : function(xml_filename) {
						dump_file = xml_filename;
						try {
							file_size = node_fs.statSync(xml_filename).size;
						} catch (e) {
							// 若不存在 dump_directory，則會在此出錯。
							if (e.code === 'ENOENT') {
								library_namespace.error('traversal_pages: '
										+ 'You may need to create '
										+ 'the dump directory yourself!');
							}
							throw e;
						}
					},
					filter : function(pageid, revid) {
						if ((pageid in rev_of_id)
								&& rev_of_id[pageid] === revid) {
							// 隨時 delete rev_of_id[] 會使速度極慢。
							// delete rev_of_id[pageid];
							rev_of_id[pageid] = null;
							return true;
						}
					},
					// options.last.call(file_stream, anchor, quit_operation)
					// of read_dump()
					last : function(anchor, quit_operation) {
						// e.g.,
						// "All 1491092 pages in dump xml file, 198.165 s."
						// includes redirection 包含重新導向頁面.
						library_namespace.log('traversal_pages: All ' + count
								+ '/' + length + ' pages using dump xml file ('
								+ (1000 * count / length | 0) / 10 + '%), '
								+ ((Date.now() - start_read_time) / 1000 | 0)
								+ ' s elapsed.');
						var need_API = [];
						need_API.is_id = is_id;
						for ( var id in rev_of_id)
							if (rev_of_id[id] !== null)
								need_API.push(id);
						// Release memory. 釋放被占用的記憶體.
						rev_of_id = null;

						// library_namespace.set_debug(3);
						// 一般可以達到 95% 以上採用 dump file 的程度，10分鐘內跑完。
						run_work(need_API, quit_operation);
					}
				});
			}

			function run_work(id_list, quit_operation) {
				if (quit_operation) {
					library_namespace.info(
					// 直接結束作業
					'traversal_pages: 已中途跳出作業，不再讀取 production database。');
					// 模擬 wiki_API.prototype.work(config) 之config.last()，與之連動。
					// 此處僅能傳入 .work() 在執行 .last() 時提供的 arguments。
					// 但因為 .work() 在執行 .last() 時也沒傳入 arguments，
					// 因此此處亦不傳入 arguments。
					if (typeof config.last === 'function') {
						config.last();
					}
					return;
				}

				if (typeof config.filter === 'function')
					library_namespace.log(
					//
					'traversal_pages: 開始讀取 production，執行 .work(): '
							+ (id_list && id_list.length) + ' pages...');
				session.work({
					is_id : id_list.is_id,
					no_message : true,
					no_edit : 'no_edit' in config ? config.no_edit : true,
					each : callback,
					// 取得多個頁面內容所用之 options。
					// e.g., { rvprop : 'ids|timestamp|content' }
					// Warning: 這對經由 dump 取得之 page 無效！
					page_options : config.page_options,
					// run this at last.
					// 在wiki_API.prototype.work()工作最後執行此config.last()。
					// config.last(/* no meaningful arguments */)
					// 沒傳入 arguments的原因見前 "config.last();"。
					last : config.last
				}, id_list);
			}

			// 工作流程: config.filter() → run_work()

			// 若 config.filter 非 function，表示要先比對 dump，若修訂版本號相同則使用之，否則自 API 擷取。
			// 並以 try_dump() 當作 filter()。
			// 設定 config.filter 為 ((true)) 表示要使用預設為最新的 dump，
			// 否則將之當作 dump file path。

			// 若不想使用 dump，可不設定 .filter。
			// 經測試，全部使用 API，最快可入50分鐘內，一般在 1-2 hours 左右。
			var dump_file;
			if (config.filter && (typeof config.filter !== 'function')) {
				dump_file = config.filter;
				config.filter = try_dump;
			}

			if (typeof config.filter === 'function') {
				// preprocessor before running .work()
				// 可用於額外功能。
				// e.g., 若 revision 相同，從 dump 而不從 API 讀取。
				// id_list, rev_list 採用相同的 index。
				config.filter(run_work, callback, id_list, rev_list);
			} else {
				run_work(id_list);
			}

		}, {
			// cache path prefix
			// e.g., task name
			prefix : config.directory
		});
	}

	/**
	 * ((traversal_pages.id_mark)) indicate it's page id instead of page title.
	 * 表示此 cache list 為 page id，而非 page title。 須採用絕不可能用來當作標題之 value。<br />
	 * 勿用過於複雜、無法 JSON.stringify() 或過於簡單的結構。
	 */
	traversal_pages.id_mark = {};

	/** {String}default list file name (will append .json by wiki_API.cache) */
	traversal_pages.list_file = 'all_pages';

	// --------------------------------------------------------------------------------------------
	// Flow page support. Flow 功能支援。
	// [[mediawikiwiki:Extension:Flow/API]]
	// https://www.mediawiki.org/w/api.php?action=help&modules=flow

	// https://zh.wikipedia.org/w/api.php?action=query&prop=flowinfo&titles=Wikipedia_talk:Flow_tests
	// https://zh.wikipedia.org/w/api.php?action=query&prop=info&titles=Wikipedia_talk:Flow_tests
	// https://zh.wikipedia.org/w/api.php?action=flow&submodule=view-topiclist&page=Wikipedia_talk:Flow_tests&vtlformat=wikitext&utf8=1
	// .roots[0]
	// https://zh.wikipedia.org/w/api.php?action=flow&submodule=view-topic&page=Topic:sqs6skdav48d3xzn&vtformat=wikitext&utf8=1

	// https://www.mediawiki.org/w/api.php?action=flow&submodule=view-header&page=Talk:Sandbox&vhformat=wikitext&utf8=1
	// https://www.mediawiki.org/w/api.php?action=flow&submodule=view-topiclist&utf8=1&page=Talk:Sandbox

	/**
	 * get the infomation of Flow.
	 * 
	 * @param {String|Array}title
	 *            page title 頁面標題。可為話題id/頁面標題+話題標題。<br />
	 *            {String}title or [ {String}API_URL, {String}title or
	 *            {Object}page_data ]
	 * @param {Function}callback
	 *            回調函數。 callback({Object}page_data)
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 */
	function Flow_info(title, callback, options) {
		var action = normalize_title_parameter(title, options);
		if (!action) {
			throw 'Flow_info: Invalid title: ' + get_page_title_link(title);
		}

		// [[mw:Extension:StructuredDiscussions/API#Detection]]
		// 'prop=flowinfo' is deprecated. use 'query&prop=info'.
		// The content model will be 'flow-board' if it's enabled.
		action[1] = 'query&prop=info&' + action[1];
		if (!action[0])
			action = action[1];

		wiki_API.query(action, typeof callback === 'function'
		//
		&& function(data) {
			if (library_namespace.is_debug(2)
			// .show_value() @ interact.DOM, application.debug
			&& library_namespace.show_value)
				library_namespace.show_value(data, 'Flow_info: data');

			var error = data && data.error;
			// 檢查伺服器回應是否有錯誤資訊。
			if (error) {
				library_namespace.error('Flow_info: ['
				//
				+ error.code + '] ' + error.info);
				/**
				 * e.g., Too many values supplied for parameter 'pageids': the
				 * limit is 50
				 */
				if (data.warnings
				//
				&& data.warnings.query && data.warnings.query['*'])
					library_namespace.warn(data.warnings.query['*']);
				callback();
				return;
			}

			if (!data || !data.query || !data.query.pages) {
				library_namespace.warn('Flow_info: Unknown response: ['
				//
				+ (typeof data === 'object'
				//
				&& typeof JSON !== 'undefined'
				//
				? JSON.stringify(data) : data) + ']');
				if (library_namespace.is_debug()
				// .show_value() @ interact.DOM, application.debug
				&& library_namespace.show_value)
					library_namespace.show_value(data);
				callback();
				return;
			}

			// TODO: data.query.normalized=[{from:'',to:''},...]

			data = data.query.pages;
			var pages = [];
			for ( var pageid in data) {
				var page = data[pageid];
				pages.push(page);
			}

			// options.multi: 即使只取得單頁面，依舊回傳 Array。
			if (!options || !options.multi)
				if (pages.length <= 1) {
					if (pages = pages[0])
						pages.is_Flow = is_Flow(pages);
					library_namespace.debug('只取得單頁面 [[' + pages.title
					//
					+ ']]，將回傳此頁面資料，而非 Array。', 2, 'Flow_info');
				} else {
					library_namespace.debug('Get ' + pages.length
					//
					+ ' page(s)! The pages'
					//
					+ ' will all passed to callback as Array!'
					//
					, 2, 'Flow_info');
				}

			/**
			 * page 之 structure 將按照 wiki API 本身之 return！<br />
			 * <code>
			page_data = {ns,title,missing:'']}
			page_data = {pageid,ns,title,flowinfo:{flow:[]}}
			page_data = {pageid,ns,title,flowinfo:{flow:{enabled:''}}}
			 * </code>
			 */
			callback(pages);
		}, null, options);
	}

	/**
	 * 檢測 page_data 是否為 Flow 討論頁面系統。
	 * 
	 * other contentmodel: "MassMessageListContent"
	 * 
	 * @param {Object}page_data
	 *            page data got from wiki API.
	 * 
	 * @returns {Boolean}是否為 Flow 討論頁面。
	 */
	function is_Flow(page_data) {
		if ('contentmodel' in page_data) {
			// used in prop=info
			return page_data.contentmodel === 'flow-board';
		}

		var flowinfo = page_data &&
		// get_page_content.is_page_data(page_data) &&
		page_data.flowinfo;
		if (flowinfo) {
			// used in prop=flowinfo (deprecated)
			// flowinfo:{flow:{enabled:''}}
			return flowinfo.flow && ('enabled' in flowinfo.flow);
		}

		// e.g., 從 wiki_API.page 得到的 page_data
		if (page_data = get_page_content.revision(page_data))
			return page_data.contentmodel === 'flow-board';
	}

	/** {Object}abbreviation 縮寫 */
	var Flow_abbreviation = {
		// https://www.mediawiki.org/w/api.php?action=help&modules=flow%2Bview-header
		// 關於討論板的描述。使用 .revision
		header : 'h',
		// https://www.mediawiki.org/w/api.php?action=help&modules=flow%2Bview-topiclist
		// 討論板話題列表。使用 .revisions
		topiclist : 'tl'
	};

	/**
	 * get topics of the page.
	 * 
	 * @param {String|Array}title
	 *            page title 頁面標題。可為話題id/頁面標題+話題標題。 {String}title or [
	 *            {String}API_URL, {String}title or {Object}page_data ]
	 * @param {Function}callback
	 *            回調函數。 callback({Object}topiclist)
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 */
	function Flow_page(title, callback, options) {
		// 處理 [ {String}API_URL, {String}title or {Object}page_data ]
		if (!is_api_and_title(title)) {
			title = [ , title ];
		}

		var page_data;
		if (get_page_content.is_page_data(title[1]))
			page_data = title[1];

		title[1] = 'page=' + encodeURIComponent(get_page_title(title[1]));

		if (options && options.redirects)
			// 毋須 '&redirects=1'
			title[1] += '&redirects';

		// e.g., { flow_view : 'header' }
		var view = options && options.flow_view
		//
		|| Flow_page.default_flow_view;
		title[1] = 'flow&submodule=view-' + view + '&v'
				+ (Flow_abbreviation[view] || view.charAt(0).toLowerCase())
				+ 'format=' + (options && options.format || 'wikitext') + '&'
				+ title[1];

		if (!title[0])
			title = title[1];

		wiki_API.query(title, typeof callback === 'function'
		//
		&& function(data) {
			if (library_namespace.is_debug(2)
			// .show_value() @ interact.DOM, application.debug
			&& library_namespace.show_value)
				library_namespace.show_value(data, 'Flow_page: data');

			var error = data && data.error;
			// 檢查伺服器回應是否有錯誤資訊。
			if (error) {
				library_namespace.error(
				//
				'Flow_page: [' + error.code + '] ' + error.info);
				callback(page_data);
				return;
			}

			// data =
			// { flow: { 'view-topiclist': { result: {}, status: 'ok' } } }
			if (!(data = data.flow)
			//
			|| !(data = data['view-' + view]) || data.status !== 'ok') {
				library_namespace.error(
				//
				'Flow_page: Error status [' + (data && data.status) + ']');
				callback(page_data);
				return;
			}

			if (page_data)
				// assert: data.result = { ((view)) : {} }
				Object.assign(page_data, data.result);
			else
				page_data = data.result[view];
			callback(page_data);
		}, null, options);
	}

	/** {String}default view to flow page */
	Flow_page.default_flow_view = 'topiclist';

	/**
	 * Create a new topic. 發新話題。 Reply to an existing topic.
	 * 
	 * @param {String|Array}title
	 *            page title 頁面標題。 {String}title or [ {String}API_URL,
	 *            {String}title or {Object}page_data ]
	 * @param {String}topic
	 *            新話題的標題文字。 {String}topic
	 * @param {String|Function}text
	 *            page contents 頁面內容。 {String}text or {Function}text(page_data)
	 * @param {Object}token
	 *            login 資訊，包含“csrf”令牌/密鑰。
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * @param {Function}[callback]
	 *            回調函數。 callback(title, error, result)
	 * 
	 * @see https://www.mediawiki.org/w/api.php?action=help&modules=flow%2Bnew-topic
	 *      https://www.mediawiki.org/w/api.php?action=help&modules=flow%2Breply
	 */
	function edit_topic(title, topic, text, token, options, callback) {
		var action = 'flow';
		// 處理 [ {String}API_URL, {String}title or {Object}page_data ]
		if (Array.isArray(title))
			action = [ title[0], action ], title = title[1];

		if (get_page_content.is_page_data(title))
			title = title.title;
		// assert: typeof title === 'string' or title is invalid.
		if (title.length > 260) {
			// [nttopic] 話題標題已限制在 260 位元組內。
			// 自動評論與摘要的長度限制是260個字符。需要小心任何超出上述限定的東西將被裁剪掉。
			// 260 characters
			// https://github.com/wikimedia/mediawiki-extensions-Flow/blob/master/includes/Model/PostRevision.php
			// const MAX_TOPIC_LENGTH = 260;
			// https://github.com/wikimedia/mediawiki-extensions-Flow/blob/master/i18n/zh-hant.json
			library_namespace
					.warn('edit_topic: Title is too long and will be truncated: ['
							+ error.code + ']');
			title = title.slice(0, 260);
		}

		// default parameters
		var _options = {
			notification : 'flow',
			submodule : 'new-topic',
			page : title,
			nttopic : topic,
			ntcontent : text,
			ntformat : 'wikitext'
		};

		wiki_API.login.copy_keys.forEach(function(key) {
			if (options[key])
				_options[key] = options[key];
		});

		// the token should be sent as the last parameter.
		_options.token = library_namespace.is_Object(token) ? token.csrftoken
				: token;

		wiki_API.query(action, typeof callback === 'function'
		//
		&& function(data) {
			if (library_namespace.is_debug(2)
			// .show_value() @ interact.DOM, application.debug
			&& library_namespace.show_value)
				library_namespace.show_value(data, 'edit_topic: data');

			var error = data && data.error;
			// 檢查伺服器回應是否有錯誤資訊。
			if (error) {
				library_namespace.error('edit_topic: ['
				//
				+ error.code + '] ' + error.info);
			} else if (!(data = data.flow)
			//
			|| !(data = data['new-topic']) || data.status !== 'ok') {
				// data = { flow: { 'new-topic': { status: 'ok',
				// workflow: '', committed: {} } } }
				error = 'edit_topic: Error status ['
				//
				+ (data && data.status) + ']';
				library_namespace.error(error);
			}

			if (typeof callback === 'function')
				// title.title === get_page_title(title)
				callback(title.title, error, data);
		}, _options, options);
	}

	/** {Array}欲 copy 至 Flow edit parameters 之 keys。 */
	wiki_API.login.copy_keys = 'summary|bot|redirect|nocreate'.split(',');

	Object.assign(Flow_info, {
		is_Flow : is_Flow,
		page : Flow_page,
		edit : edit_topic
	});

	// --------------------------------------------------------------------------------------------
	// Wikidata 操作函數
	// https://www.wikidata.org/wiki/Wikidata:Data_access

	/**
	 * @see <code>

	// https://meta.wikimedia.org/wiki/Wikidata/Notes/Inclusion_syntax
	{{label}}, {{Q}}, [[d:Q1]]

	http://wdq.wmflabs.org/api_documentation.html
	https://github.com/maxlath/wikidata-sdk

	</code>
	 * 
	 * @since
	 */

	/**
	 * 測試 value 是否為實體項目 wikidata entity / wikibase-item.
	 * 
	 * is_wikidata_page()
	 * 
	 * @param value
	 *            value to test. 要測試的值。
	 * @param {Boolean}[strict]
	 *            嚴格檢測。
	 * 
	 * @returns {Boolean}value 為實體項目。
	 */
	function is_entity(value, strict) {
		return library_namespace.is_Object(value)
		// {String}id: Q\d+ 或 P\d+。
		&& (strict ? /^[PQ]\d{1,10}$/.test(value.id) : value.id)
		//
		&& library_namespace.is_Object(value.labels);
	}

	/**
	 * API URL of wikidata.<br />
	 * e.g., 'https://www.wikidata.org/w/api.php',
	 * 'https://test.wikidata.org/w/api.php'
	 * 
	 * @type {String}
	 */
	var wikidata_API_URL = api_URL('wikidata');

	/**
	 * Combine ((session)) with Wikidata. 立即性(asynchronous)設定 this.data_session。
	 * 
	 * @param {wiki_API}session
	 *            正作業中之 wiki_API instance。
	 * @param {Function}[callback]
	 *            回調函數。 callback({Array}entity list or {Object}entity or
	 * @param {String}[API_URL]
	 *            language code or API URL of Wikidata
	 * @param {String}[password]
	 *            user password
	 * @param {Boolean}[force]
	 *            無論如何重新設定 this.data_session。
	 * 
	 * @inner
	 */
	function setup_data_session(session, callback, API_URL, password, force) {
		if (force === undefined) {
			if (typeof password === 'boolean') {
				// shift arguments.
				force = password;
				password = null;
			} else if (typeof API_URL === 'boolean' && password === undefined) {
				// shift arguments.
				force = API_URL;
				API_URL = null;
			}
		}

		if (session.data_session && API_URL & !force) {
			return;
		}

		if (session.data_session) {
			library_namespace.debug('直接清空佇列。', 2, 'setup_data_session');
			// TODO: 強制中斷所有正在執行之任務。
			session.data_session.actions.clear();
		}

		if (typeof API_URL === 'string' && !/wikidata/i.test(API_URL)
				&& !PATTERN_PROJECT_CODE_i.test(API_URL)) {
			// e.g., 'test' → 'test.wikidata'
			API_URL += '.wikidata';
		}

		// set Wikidata session
		var data_config = [ session.token.lgname,
		// wiki.set_data(host session, password)
		password || session.token.lgpassword,
		// API_URL: host session
		typeof API_URL === 'string' && api_URL(API_URL) || wikidata_API_URL ];
		if (data_config[0] && data_config[1]) {
			session.data_session = wiki_API.login(data_config[0],
					data_config[1], data_config[2]);
		} else {
			session.data_session = new wiki_API(data_config[0], data_config[1],
					data_config[2]);
		}

		library_namespace.debug('setup 宿主 host session.', 2,
				'setup_data_session');
		session.data_session[KEY_HOST_SESSION] = session;
		library_namespace.debug('run callback: ' + callback, 2,
				'setup_data_session');
		session.data_session.run(callback);
	}

	// ------------------------------------------------------------------------

	function normalize_wikidata_key(key) {
		if (typeof key !== 'string') {
			library_namespace.error('normalize_wikidata_key: key: '
					+ JSON.stringify(key));
			// console.trace(key);
			throw 'normalize_wikidata_key: typeof key is NOT string!';
		}
		return key.replace(/_/g, ' ').trim();
	}

	function is_wikidata_site(site_or_language) {
		// TODO: 不是有包含'wiki'的全都是site。
		library_namespace.debug('Test ' + site_or_language, 3,
				'is_wikidata_site');
		return /^[a-z_\d]{2,20}?(?:wiki(?:[a-z]{4,7})?|wiktionary)$/
				.test(site_or_language);
	}

	/**
	 * 搜索標籤包含特定關鍵字(label=key)的項目。
	 * 
	 * 此搜索有極大問題:不能自動偵測與轉換中文繁簡體。 或須轉成英語再行搜尋。
	 * 
	 * @example<code>

	CeL.wiki.data.search('宇宙', function(entity) {result=entity;console.log(entity[0]==='Q1');}, {get_id:true});
	CeL.wiki.data.search('宇宙', function(entity) {result=entity;console.log(entity==='Q1');}, {get_id:true, limit:1});
	CeL.wiki.data.search('形狀', function(entity) {result=entity;console.log(entity==='P1419');}, {get_id:true, type:'property'});

	</code>
	 * 
	 * @param {String}key
	 *            要搜尋的關鍵字。item/property title.
	 * @param {Function}[callback]
	 *            回調函數。 callback({Array}entity list or {Object}entity or
	 *            {String}entity id, error)
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 */
	function wikidata_search(key, callback, options) {
		if (!key) {
			callback(undefined, 'wikidata_search: No key assigned.');
			return;
		}
		if (typeof options === 'function')
			options = {
				filter : options
			};
		else if (typeof options === 'string') {
			options = {
				language : options
			};
		} else {
			// 正規化並提供可隨意改變的同內容參數，以避免修改或覆蓋附加參數。
			options = library_namespace.new_options(options);
		}

		var language = options.language;
		if (is_api_and_title(key, 'language')) {
			if (is_wikidata_site(key[0])) {
				wikidata_entity(key, function(entity, error) {
					// console.log(entity);
					var id = !error && entity && entity.id;
					// 預設找不到 sitelink 會作搜尋。
					if (!id && !options.no_search) {
						key = key.clone();
						if (key[0] = key[0].replace(/wiki.*$/, '')) {
							wikidata_search(key, callback, options);
							return;
						}
					}
					callback(id, error);
				}, {
					props : ''
				});
				return;
			}
			// for [ {String}language, {String}key ]
			language = key[0];
			key = key[1];
		}

		// console.log('key: ' + key);
		key = normalize_wikidata_key(key);
		var action = [ API_URL_of_options(options) || wikidata_API_URL,
		// search. e.g.,
		// https://www.wikidata.org/w/api.php?action=wbsearchentities&search=abc&language=en&utf8=1
		'wbsearchentities&search=' + encodeURIComponent(key)
		// https://www.wikidata.org/w/api.php?action=help&modules=wbsearchentities
		+ '&language=' + (language
		//
		|| wikidata_get_site(options, true) || default_language)
		//
		+ '&limit=' + (options.limit || 'max') ];

		if (options.type) {
			// item|property
			// 預設值：item
			action[1] += '&type=' + options.type;
		}

		if (options['continue'] > 0)
			action[1] += '&continue=' + options['continue'];

		wiki_API.query(action, function(data, error) {
			if (!error) {
				error = data ? data.error : 'No data get';
			}
			// 檢查伺服器回應是否有錯誤資訊。
			if (error) {
				library_namespace.error('wikidata_search: ['
				//
				+ error.code + '] ' + error.info);
				callback(undefined, error);
				return;
			}

			// console.log(data);
			var list;
			if (!Array.isArray(data.search)) {
				list = [];
			} else if (!('filter' in options)
					|| typeof options.filter === 'function') {
				list = data.search.filter(options.filter ||
				// default filter
				function(item) {
					// 自此結果能得到的資訊有限。
					// label: 'Universe'
					// match: { type: 'label', language: 'zh', text: '宇宙' }
					if (item.match && key === item.match.text
					// 通常不會希望取得維基百科消歧義頁。
					// @see 'Wikimedia disambiguation page' @
					// [[d:MediaWiki:Gadget-autoEdit.js]]
					&& !/disambiguation|消歧義|消歧義|曖昧さ回避/.test(item.description)) {
						return true;
					}
				});
			}

			if (Array.isArray(options.list)) {
				options.list.push(list);
			} else {
				options.list = [ list ];
			}
			list = options.list;

			if (!options.limit && data['search-continue'] > 0) {
				options['continue'] = data['search-continue'];
				wikidata_search(key, callback, options);
				return;
			}

			if (Array.isArray(list.length) && list.length > 1) {
				// clone list
				list = list.clone();
			} else {
				list = list[0];
			}
			if (options.get_id) {
				list = list.map(function(item) {
					return item.id;
				});
			}
			if (!options.multi && (
			// options.limit <= 1
			list.length <= 1)) {
				list = list[0];
			}
			callback(list);
		}, null, options);
	}

	// wikidata_search_cache[{String}"zh:性質"] = {String}"P31";
	var wikidata_search_cache = {
	// 載於, 出典, source of claim
	// 'en:stated in' : 'P248',
	// 導入自, source
	// 'en:imported from' : 'P143',
	// 來源網址, website
	// 'en:reference URL' : 'P854',
	// 檢索日期
	// 'en:retrieved' : 'P813'
	},
	// entity (Q\d+) 用。
	// 可考量加入 .type (item|property) 為 key 的一部分，
	// 或改成 wikidata_search_cache={item:{},property:{}}。
	wikidata_search_cache_entity = Object.create(null);

	wikidata_search.add_cache = function(key, id, language, is_entity) {
		cached_hash = is_entity ? wikidata_search_cache_entity
				: wikidata_search_cache;
		language = wikidata_get_site(language, true) || default_language;
		cached_hash[language + ':' + key] = id;
	};

	// wrapper function of wikidata_search().
	wikidata_search.use_cache = function(key, callback, options) {
		if (!options && library_namespace.is_Object(callback)) {
			// shift arguments.
			options = callback;
			callback = undefined;
		}

		var language_and_key,
		// 須與 wikidata_search() 相同!
		// TODO: 可以 guess_language(key) 猜測語言。
		language = wikidata_get_site(options, true) || default_language,
		// https://www.wikidata.org/w/api.php?action=help&modules=wbsearchentities
		cached_hash = options && options.type && options.type !==
		// default_options.type: 'property'
		wikidata_search.use_cache.default_options.type ? wikidata_search_cache_entity
				: wikidata_search_cache;

		// console.log(key);
		if (library_namespace.is_Object(key)) {
			// convert language+value object
			if (key.language && ('value' in key)) {
				// e.g., {language:'ja',value:'日本'}
				key = [ key.language, key.value ];
			} else if ((language_and_key = Object.keys(key)).length === 1
			// e.g., {ja:'日本'}
			&& (language_and_key = language_and_key[0])) {
				key = [ language_and_key, key[language_and_key] ];
			}
		}

		if (typeof key === 'string') {
			key = normalize_wikidata_key(key);
			language_and_key = language + ':' + key;

		} else if (Array.isArray(key)) {
			if (is_api_and_title(key, 'language')) {
				// key.join(':')
				language_and_key = key[0] + ':'
				//
				+ normalize_wikidata_key(key[1]);
			} else {
				// 處理取得多 keys 之 id 的情況。
				var index = 0,
				//
				cache_next_key = function() {
					library_namespace.debug(index + '/' + key.length, 3,
							'use_cache.cache_next_key');
					if (index === key.length) {
						// done. callback(id_list)
						callback(key.map(function(k) {
							if (is_api_and_title(k, 'language')) {
								return cached_hash[k[0] + ':'
								//
								+ normalize_wikidata_key(k[1])];
							}
							k = normalize_wikidata_key(k);
							return cached_hash[language + ':' + k];
						}));
						return;
					}
					// console.log(options);
					// console.trace(1);
					wikidata_search.use_cache(key[index++], cache_next_key,
					//
					Object.assign({
						API_URL : get_data_API_URL(options),
					}, wikidata_search.use_cache.default_options, {
						// 警告:若是設定must_callback=false，會造成程序不callback而中途跳出!
						must_callback : true
					}, options));
				};
				cache_next_key();
				return;
			}

		} else {
			// 避免若是未match is_api_and_title(key, 'language')，
			// 可能導致 infinite loop!
			key = 'wikidata_search.use_cache: Invalid key: [' + key + ']';
			// console.warn(key);
			callback(undefined, key);
			return;
		}
		library_namespace.debug('search '
				+ (language_and_key || JSON.stringify(key)) + ' ('
				+ is_api_and_title(key, 'language') + ')', 4,
				'wikidata_search.use_cache');

		if ((!options || !options.force)
		// TODO: key 可能是 [ language code, labels|aliases ] 之類。
		// &&language_and_key
		&& (language_and_key in cached_hash)) {
			library_namespace.debug('has cache: [' + language_and_key + '] → '
					+ cached_hash[language_and_key], 4,
					'wikidata_search.use_cache');
			key = cached_hash[language_and_key];

			if (/^[PQ]\d{1,10}$/.test(key)) {
			}
			if (options && options.must_callback) {
				callback(key);
				return;
			} else {
				// 只在有 cache 時才即刻回傳。
				return key;
			}
		}

		if (!options || library_namespace.is_empty_object(options)) {
			options = Object.clone(wikidata_search.use_cache.default_options);
		} else if (!options.get_id) {
			if (!options.must_callback) {
				// 在僅設定 .must_callback 時，不顯示警告而自動補上應有的設定。
				library_namespace.warn('wikidata_search.use_cache: 當把實體名稱 ['
						+ language_and_key
						+ '] 轉換成 id 時，應設定 options.get_id。 options: '
						+ JSON.stringify(options));
			}
			options = Object.assign({
				get_id : true
			}, options);
		}

		// console.log(arguments);
		wikidata_search(key, function(id, error) {
			// console.log(language_and_key + ': ' + id);
			if (!id) {
				library_namespace
						.error('wikidata_search.use_cache: Nothing found: ['
								+ language_and_key + ']');
				// console.log(options);
				// console.trace('wikidata_search.use_cache: Nothing found');

			} else if (typeof id === 'string' && /^[PQ]\d{1,10}$/.test(id)) {
				library_namespace.debug('cache '
				// 搜尋此類型的實體。 預設值：item
				+ (options && options.type || 'item')
				//
				+ ' ' + id + ' ← [' + language_and_key + ']', 1,
						'wikidata_search.use_cache');
			}
			// 即使有錯誤，依然做 cache 紀錄，避免重複偵測操作。
			cached_hash[language_and_key] = id;

			callback(id, error);
		}, options);
	};

	// default options passed to wikidata_search()
	wikidata_search.use_cache.default_options = {
		// 若有必要用上 options.API_URL，應在個別操作內設定。

		// 通常 property 才值得使用 cache。
		// entity 可採用 'item'
		// https://www.wikidata.org/w/api.php?action=help&modules=wbsearchentities
		type : 'property',
		// limit : 1,
		get_id : true
	};

	// ------------------------------------------------------------------------

	/**
	 * {Array}時間精度(精密度)單位。
	 * 
	 * 注意：須配合 index_precision @ CeL.data.date！
	 * 
	 * @see https://www.mediawiki.org/wiki/Wikibase/DataModel/JSON#time
	 */
	var time_unit = 'gigayear,100 megayear,10 megayear,megayear,100 kiloyear,10 kiloyear,millennium,century,decade,year,month,day,hour,minute,second,microsecond'
			.split(','),
	// 精確至日: 11。
	INDEX_OF_PRECISION = time_unit.to_hash();
	time_unit.zh = '十億年,億年,千萬年,百萬年,十萬年,萬年,千紀,世紀,年代,年,月,日,時,分,秒,毫秒,微秒,納秒'
			.split(',');

	/**
	 * 將時間轉為字串。
	 * 
	 * @inner
	 */
	function time_toString() {
		var unit = this.unit;
		if (this.power) {
			unit = Math.abs(this[0]) + unit[0];
			return this.power > 1e4 ? unit + (this[0] < 0 ? '前' : '後')
			//
			: (this[0] < 0 ? '前' : '') + unit;
		}

		return this.map(function(value, index) {
			return value + unit[index];
		}).join('');
	}

	/**
	 * 將經緯度座標轉為字串。
	 * 
	 * @inner
	 */
	function coordinate_toString(type) {
		// 經緯度座標 coordinates [ latitude 緯度, longitude 經度 ]
		return Marh.abs(this[0]) + ' ' + (this[0] < 0 ? 'S' : 'N')
		//
		+ ', ' + Marh.abs(this[1]) + ' ' + (this[1] < 0 ? 'W' : 'E');
	}

	/**
	 * 將特定的屬性值轉為JavaScript的物件。
	 * 
	 * @param {Object}value
	 *            從Wikidata所得到的屬性值。
	 * @param {Function}[callback]
	 *            回調函數。 callback(轉成JavaScript的值)
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * 
	 * @returns 轉成JavaScript的值。
	 * 
	 * @see https://www.mediawiki.org/wiki/Wikibase/API#wbformatvalue
	 *      https://www.mediawiki.org/wiki/Wikibase/DataModel/JSON#Claims_and_Statements
	 *      https://www.mediawiki.org/wiki/Wikibase/API
	 *      https://www.mediawiki.org/wiki/Wikibase/Indexing/RDF_Dump_Format#Value_representation
	 *      https://www.wikidata.org/wiki/Special:ListDatatypes
	 */
	function wikidata_datavalue(value, callback, options) {
		if (library_namespace.is_Object(callback) && !options) {
			// shift arguments.
			options = callback;
			callback = undefined;
		}
		if (options && options.multi && !Array.isArray(value)) {
			delete options.multi;
			if (typeof callback === 'function') {
				wikidata_datavalue(value, function() {
					callback([ value ]);
				}, options);
			}
			value = [ wikidata_datavalue(value, undefined, options) ];
			return value;
		}

		if (Array.isArray(value)) {
			if (options && options.multi || value.length > 1
					&& (!options || !options.single)) {
				if (options && options.multi) {
					// 正規化並提供可隨意改變的同內容參數，以避免修改或覆蓋附加參數。
					options = library_namespace.new_options(options);
					delete options.multi;
				}
				// TODO: array + ('numeric-id' in value)
				value = value.map(function(v) {
					return wikidata_datavalue(v, undefined, options);
				});
				if (typeof callback === 'function') {
					callback(value);
				}
				return value;
			}

			// 選擇推薦值/最佳等級。
			var first;
			if (value.every(function(v) {
				if (!v) {
					return true;
				}
				if (v.rank !== 'preferred') {
					if (!first) {
						first = v;
					}
					return true;
				}
				// TODO: check v.mainsnak.datavalue.value.language
				value = v;
				// return false;
			})) {
				// 沒有推薦值，選擇首個非空的值。
				value = first;
			}
		}

		if (is_entity(value)) {
			// get label of entity
			value = value.labels;
			var language = wikidata_get_site(options, true);
			language = language && value[language] || value[default_language]
			// 最起碼選個國際通用的。
			|| value.en;
			if (!language) {
				// 隨便挑一個語言的 label。
				for (language in value) {
					value = value[language];
					break;
				}
			}
			return value.value;
		}

		if (!value) {
			return value;
		}

		// TODO: value.qualifiers, value['qualifiers-order']
		// TODO: value.references
		value = value.mainsnak || value;
		if (value) {
			// 與 normalize_wikidata_value() 須同步!
			if (value.snaktype === 'novalue') {
				return null;
			}
			if (value.snaktype === 'somevalue') {
				return wikidata_edit.somevalue;
			}
		}
		// assert: value.snaktype === 'value'
		value = value.datavalue || value;

		var type = value.type;
		// TODO: type 可能為 undefined!

		if ('value' in value)
			value = value.value;

		if (typeof value !== 'object') {
			// e.g., typeof value === 'string'
			if (typeof callback === 'function')
				callback(value);
			return value;
		}

		if ('text' in value) {
			// e.g., { text: 'Ὅμηρος', language: 'grc' }
			return value.text;
		}

		if ('amount' in value) {
			// qualifiers 純量數值
			if (typeof callback === 'function')
				callback(+value.amount);
			return +value.amount;
		}

		if ('latitude' in value) {
			// 經緯度座標 coordinates [ latitude 緯度, longitude 經度 ]
			var coordinate = [ value.latitude, value.longitude ];
			if (false) {
				// geodetic reference system, 大地座標系/坐標系統測量基準
				var system = value.globe.match(/[^\\\/]+$/);
				system = system && system[0];
				switch (system) {
				case 'Q2':
					coordinate.system = 'Earth';
					break;
				case 'Q11902211':
					coordinate.system = 'WGS84';
					break;
				case 'Q215848':
					coordinate.system = 'WGS';
					break;
				case 'Q1378064':
					coordinate.system = 'ED50';
					break;
				default:
					if (system)
						coordinate.system = system;
					else
						// invalid data?
						;
				}
			}
			// TODO: precision
			coordinate.precision = value.precision;
			coordinate.toString = coordinate_toString;
			return coordinate;
		}

		if ('time' in value) {
			// date & time. 時間日期
			var matched, year, precision = value.precision;

			if (precision <= 9) {
				matched = value.time.match(/^[+\-]\d+/);
				year = +matched[0];
				var power = Math.pow(10, 9 - precision);
				matched = [ year / power | 0 ];
				matched.unit = [ time_unit.zh[precision] ];
				matched.power = power;

			} else {
				matched = value.time.match(
				// [ all, Y, m, d, H, M, S ]
				/^([+\-]\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)Z$/);
				// +1: is length, not index
				// +1: year starts from 1.
				matched = matched.slice(1, precision - 9 + 1 + 1)
				//
				.map(function(value) {
					return +value;
				});
				year = matched[0];
				matched.unit = time_unit.zh.slice(9, precision + 1);
			}

			// proleptic Gregorian calendar:
			// http://www.wikidata.org/entity/Q1985727
			// proleptic Julian calendar:
			// http://www.wikidata.org/entity/Q1985786
			var type = value.calendarmodel.match(/[^\\\/]+$/);
			if (type && type[0] === 'Q1985786') {
				matched.Julian = true;
				// matched.type = 'Julian';
			} else if (type && type === 'Q1985727') {
				// matched.type = 'Gregorian';
			} else {
				// matched.type = type || value.calendarmodel;
			}

			var Julian_day;
			if (year >= -4716
			//
			&& (Julian_day = library_namespace.Julian_day))
				// start JDN
				matched.JD = Julian_day.from_YMD(year, matched[1], matched[2],
						!matched.Julian);
			matched.toString = time_toString;
			if (typeof callback === 'function')
				callback(matched);
			return matched;
		}

		if ('numeric-id' in value) {
			// wikidata entity. 實體
			value = 'Q' + value['numeric-id'];
			if (typeof callback === 'function') {
				library_namespace.debug('Trying to get entity ' + value, 1,
						'wikidata_datavalue');
				wikidata_entity(value, options && options.get_object ? callback
				// default: get label 標籤標題
				: function(entity) {
					entity = entity.labels || entity;
					entity = entity[wikidata_get_site(options, true)
							|| default_language]
							|| entity;
					callback('value' in entity ? entity.value : entity);
				}, wikidata_get_site(options, true));
			}
			return value;
		}

		library_namespace.warn('wikidata_datavalue: 尚無法處理此屬性: [' + type
				+ ']，請修改本函數。');
		return value;
	}

	// 取得value在property_list中的index。相當於 property_list.indexOf(value)
	// type=-1: list.lastIndexOf(value), type=1: list.includes(value),
	// other type: list.indexOf(value)
	wikidata_datavalue.get_index = function(property_list, value, type) {
		function to_comparable(value) {
			if (Array.isArray(value) && value.JD) {
				// e.g., new Date('2000-1-1 UTC+0')
				var date = new Date(value.join('-') + ' UTC+0');
				if (isNaN(date.getTime())) {
					library_namespace
							.error('wikidata_datavalue.get_index: Invalid Date: '
									+ value);
				}
				value = date;
			}
			// e.g., library_namespace.is_Date(value)
			return typeof value === 'object' ? JSON.stringify(value) : value;
		}

		property_list = wikidata_datavalue(property_list, undefined, {
			multi : true
		}).map(to_comparable);

		value = to_comparable(value && value.datavalue ? wikidata_datavalue(value)
				: value);

		if (!isNaN(value) && property_list.every(function(v) {
			return typeof v === 'number';
		})) {
			value = +value;
		}

		// console.log([ value, property_list ]);

		if (type === 0) {
			return [ property_list, value ];
		}
		if (type === 1) {
			return property_list.includes(value);
		}
		if (type === -1) {
			return property_list.lastIndexOf(value);
		}
		return property_list.indexOf(value);
	};

	// ------------------------------------------------------------------------

	// @see [[:en:Help:Interwiki linking#Project titles and shortcuts]],
	// [[:zh:Help:跨语言链接#出現在正文中的連結]]
	// TODO:
	// [[:phab:T102533]]
	// [[:sourceforge:project/shownotes.php?release id=226003&group id=34373]]
	// http://sourceforge.net/project/shownotes.php%3Frelease_id%3D226003%26group_id%3D34373
	// [[:gerrit:gitweb?p=mediawiki/core.git;a=blob;f=RELEASE-NOTES-1.23]]
	// https://gerrit.wikimedia.org/r/gitweb%3Fp%3Dmediawiki/core.git;a%3Dblob;f%3DRELEASE-NOTES-1.23
	// [[:google:湘江]]
	// https://www.google.com/search?q=%E6%B9%98%E6%B1%9F
	// [[:imdbtitle:0075713]], [[:imdbname:2339825]] → {{imdb name}}
	// http://www.imdb.com/title/tt0075713/
	// [[:arxiv:Hep-ex/0403017]]
	// [[:gutenberg:27690]]
	// [[:scores:Das wohltemperierte Klavier I, BWV 846-869 (Bach, Johann
	// Sebastian)]]
	// [[:wikt:제비]]
	// [[:yue:海珠湖國家濕地公園]]

	// @see set_default_language()
	// language-code.wikipedia.org e.g., zh-classical.wikipedia.org
	//
	// IETF language tag language code for gettext()
	// e.g., zh-classical → lzh
	// [[language_code:]] e.g., [[zh-classical:]] @see [[m:List of Wikipedias]]
	// [[yue:]] → zh-yue → zh_yuewiki
	//
	// site_namewiki for Wikidata API e.g., zh-classical → zh_classicalwiki
	// @see https://www.wikidata.org/w/api.php?action=help&modules=wbgetentities
	// language_code for database e.g., zh-classical → zh_classicalwiki_p

	/**
	 * language code → Wikidata site code / Wikidata site name / Wikimedia
	 * project name<br />
	 * 將語言代碼轉為 Wikidata API 可使用之 site name。
	 * 
	 * @example<code>

	// e.g., 'enwiki', 'zhwiki', 'enwikinews'
	CeL.wiki.site_name(wiki)

	</code>
	 * 
	 * @param {String}language
	 *            語言代碼, project code or session。 e.g., en, zh-classical, ja
	 * @param {String}[family]
	 *            Wikimedia project / family. e.g., wikipedia, wikinews,
	 *            wiktionary. assert: family &&
	 *            /^wik[it][a-z]{0,9}$/.test(family)
	 * 
	 * @returns {String}Wikidata API 可使用之 site name。
	 * 
	 * @see wikidata_get_site()
	 * @see https://www.wikidata.org/w/api.php?action=help&modules=wbgetentities
	 * 
	 * @since 2017/9/4 20:57:8 整合原先的 language_to_project(),
	 *        language_to_site_name()
	 */
	function language_to_site_name(language, family) {
		// 不能保證 is_wiki_API(language) → is_Object(language)，因此使用 typeof。
		if (typeof language === 'object') {
			var session = language[KEY_SESSION];
			if (session) {
				// treat language as options.
				// options.language 較 session 的設定優先。
				language = language.language || session.API_URL;
			} else if (is_wiki_API(language)) {
				// treat language as session.
				session = language;
				// assert: typeof language.API_URL === 'string'
				language = session.API_URL;
			}
		}

		if (language) {
			// 正規化。
			language = String(language).trim().toLowerCase();
			if (language
			// e.g., 'user talk' → 'user_talk'
			.replace(/[_\- ]+/g, '_') in get_namespace.hash) {
				// e.g., input "language" of [[Category:title]]
				// 光是只有 "Category"，代表還是在本 wiki 中，不算外語言。
				// return language;
				return default_language
						+ (!family || family === 'wikipedia' ? 'wiki' : family);
			}

			/**
			 * matched: [ 0: protocol + host name, 1: protocol, 2: host name,<br />
			 * 3: 第一 domain name (e.g., language code / family / project),<br />
			 * 4: 第二 domain name (e.g., family: 'wikipedia') ]
			 * 
			 * @see PATTERN_PROJECT_CODE
			 */
			var matched = language.match(PATTERN_wiki_project_URL);
			if (matched) {
				library_namespace.debug(language, 4, 'language_to_site_name');
				family = family || matched[4];
				// TODO: error handling
				matched = matched[3]
				// e.g., 'zh-min-nan' → 'zh_min_nan'
				.replace(/[- ]/g, '_')
				// e.g., language = [ ..., 'zh', 'wikinews' ] → 'zhwikinews'
				+ (family === 'wikipedia' ? 'wiki' : family);
				library_namespace.debug(matched, 3, 'language_to_site_name');
				return matched;
			}
		} else {
			// 警告: 若是沒有輸入，則會直接回傳預設的語言。因此您或許需要先檢測是不是設定了 language。
			language = default_language.replace(/[- ]/g, '_');
		}

		var matched = language
		// 拆分 language, family。以防 incase wikt, wikisource
		// testwikidatawiki → testwikidata,wiki
		.match(/^([a-z\d_]+)(wik[it][a-z]{0,9}?)$/, '');
		if (matched) {
			language = matched[1];
			family = family || matched[2];
		}

		if (language in language_code_to_site_alias) {
			// e.g., 'lzh' → 'zh-classical'
			language = language_code_to_site_alias[language];
		}

		return language + (!family || family === 'wikipedia' ? 'wiki' : family);
	}

	/**
	 * language code → Wikidata site name / Wikimedia project name<br />
	 * 將語言代碼轉為 Wikidata site name / Wikimedia project name。
	 * 
	 * @param {String}language
	 *            語言代碼, project code or session。
	 * 
	 * @returns {String}Wikidata site name / Wikimedia project name。
	 * 
	 * @see wikidata_get_site()
	 */
	function deprecated_language_to_project(language) {
		if (is_wiki_API(language)) {
			// treat language as session.
			// assert: typeof language.API_URL === 'string'
			language = language.API_URL.toLowerCase().match(
			// @see PATTERN_PROJECT_CODE
			/\/\/([a-z][a-z\d\-]{0,14})\.([a-z]+)/);
			library_namespace.debug(language, 4, 'language_to_project');
			// TODO: error handling
			language = language[1].replace(/-/g, '_')
			// e.g., language = [ ..., 'zh', 'wikinews' ] → 'zhwikinews'
			+ (language[2] === 'wikipedia' ? 'wiki' : language[2]);
			library_namespace.debug(language, 3, 'language_to_project');
			return language;
		}

		// 正規化。
		language = language && String(language).trim().toLowerCase()
		// 以防 incase wikt, wikisource
		.replace(/wik.+$/, '') || default_language;

		if (language.startsWith('category')) {
			// e.g., input "language" of [[Category:title]]
			// 光是只有 "Category"，代表還是在本 wiki 中，不算外語言。
			return language;
			return default_language + 'wiki';
		}

		if (language in language_code_to_site_alias) {
			// e.g., 'lzh' → 'zh-classical'
			language = language_code_to_site_alias[language];
		}

		// e.g., 'zh-min-nan' → 'zh_min_nan'
		var site = language.replace(/-/g, '_') + 'wiki';
		if (site in wikidata_site_alias) {
			site = wikidata_site_alias[site];
		}

		return site;
	}

	/**
	 * language code → Wikidata site code<br />
	 * 將語言代碼轉為 Wikidata API 可使用之 site name。
	 * 
	 * @param {String}language
	 *            語言代碼。
	 * 
	 * @returns {String}Wikidata API 可使用之 site name。
	 * 
	 * @see https://www.wikidata.org/w/api.php?action=help&modules=wbgetentities
	 */
	function deprecated_language_to_site(language) {
		// 正規化。
		language = language && typeof language !== 'object' ? String(language)
				.trim().toLowerCase()
		// 警告: 若是沒有輸入，則會直接回傳預設的語言。因此您或許需要先檢測是不是設定了 language。
		: default_language;

		if (language.startsWith('category')) {
			// e.g., input "language" of [[Category:title]]
			// 光是只有 "Category"，代表還是在本 wiki 中，不算外語言。
			return language;
			return default_language + 'wiki';
		}

		// e.g., 'zh-min-nan' → 'zh_min_nan'
		var site = language.replace(/-/g, '_');
		if (!site.includes('wik')) {
			// 以防 incase wikt, wikisource
			site += 'wiki';
		}

		if (site in wikidata_site_alias) {
			site = wikidata_site_alias[site];
		}

		return site;
	}

	/**
	 * 自 options[KEY_SESSION] 取得 wikidata API 所須之 site parameter。
	 * 
	 * @param {Object}options
	 *            附加參數/設定選擇性/特殊功能與選項
	 * @param {Boolean}get_language
	 *            get language instead of site
	 * 
	 * @return {String}wikidata API 所須之 site parameter。
	 * 
	 * @inner 現階段屬於內部成員。未來可能會改變。
	 */
	function wikidata_get_site(options, get_language) {
		if (typeof options === 'string') {
			return PATTERN_PROJECT_CODE.test(options) && options;
		}
		var session = options && options[KEY_SESSION],
		// options.language 較 session 的設定優先。
		language = options && options.language;
		if (session) {
			if (!language) {
				// 注意:在取得 page 後，中途更改過 API_URL 的話，這邊會取得錯誤的資訊！
				language = session.language
				// 應該採用來自宿主 host session 的 language. @see setup_data_session()
				|| session[KEY_HOST_SESSION]
						&& session[KEY_HOST_SESSION].language;
			}
			// console.log(session[KEY_HOST_SESSION]);
			if (!language) {
				var API_URL = session[KEY_HOST_SESSION]
						&& session[KEY_HOST_SESSION].API_URL || session.API_URL;
				if (language = API_URL.match(PATTERN_wiki_project_URL)) {
					// 去掉 '.org' 之類。
					language = language[3];
				}
			}
		}
		if (false) {
			library_namespace.debug('language: ' + options + '→'
					+ language_to_site_name(language || options), 3,
					'wikidata_get_site');
		}
		return get_language ? language : language_to_site_name(language
				|| options);
	}

	/**
	 * get label of entity. 取得指定實體的標籤。
	 * 
	 * CeL.wiki.data.label_of()
	 * 
	 * @param {Object}entity
	 *            指定實體。
	 * @param {String}[language]
	 *            指定取得此語言之資料。
	 * @param {Boolean}[use_title]
	 *            當沒有標籤的時候，使用各語言連結標題。
	 * @param {Boolean}[get_labels]
	 *            取得所有標籤。
	 * 
	 * @returns {String|Array}標籤。
	 */
	function get_entity_label(entity, language, use_title, get_labels) {
		if (get_labels) {
			if (use_title) {
				use_title = get_entity_link(entity, language);
				if (!Array.isArray(use_title))
					use_title = use_title ? [ use_title ] : [];
			}
			return entity_labels_and_aliases(entity, language, use_title);
		}

		var labels = entity && entity.labels;
		if (labels) {
			var label = labels[language || default_language];
			if (label)
				return label.value;
			if (!language)
				return labels;
		}

		if (use_title) {
			return get_entity_link(entity, language);
		}
	}

	/**
	 * get site link of entity. 取得指定實體的語言連結標題。
	 * 
	 * CeL.wiki.data.title_of(entity, language)
	 * 
	 * @param {Object}entity
	 *            指定實體。
	 * @param {String}[language]
	 *            指定取得此語言之資料。
	 * 
	 * @returns {String}語言標題。
	 */
	function get_entity_link(entity, language) {
		var sitelinks = entity && entity.sitelinks;
		if (sitelinks) {
			var link = sitelinks[language_to_site_name(language)];
			if (link) {
				return link.title;
			}
			if (!language) {
				link = [];
				for (language in sitelinks) {
					link.push(sitelinks[language].title);
				}
				return link;
			}
		}
	}

	// 以下兩者必須不可能為 entity / property 之屬性。
	// 相關/對應頁面。
	var KEY_CORRESPOND_PAGE = 'page',
	// 用來取得 entity value 之屬性名。 函數 : wikidata_entity_value
	KEY_get_entity_value = 'value';

	/**
	 * 取得特定實體的特定屬性值。
	 * 
	 * @example<code>

	CeL.wiki.data('Q1', function(entity) {result=entity;});
	CeL.wiki.data('Q2', function(entity) {result=entity;console.log(JSON.stringify(entity).slice(0,400));});
	CeL.wiki.data('Q1', function(entity) {console.log(entity.id==='Q1'&&JSON.stringify(entity.labels)==='{"zh":{"language":"zh","value":"宇宙"}}');}, {languages:'zh'});
	CeL.wiki.data('Q1', function(entity) {console.log(entity.labels['en'].value+': '+entity.labels['zh'].value==='universe: 宇宙');});
	// Get the property of wikidata entity.
	// 取得Wikidata中指定實體項目的指定屬性/陳述。
	CeL.wiki.data('Q1', function(entity) {console.log(entity['en'].value+': '+entity['zh'].value==='universe: 宇宙');}, 'labels');
	// { id: 'P1', missing: '' }
	CeL.wiki.data('Q1|P1', function(entity) {console.log(JSON.stringify(entity[1])==='{"id":"P1","missing":""}');});
	CeL.wiki.data(['Q1','P1'], function(entity) {console.log(entity);});

	CeL.wiki.data('Q11188', function(entity) {result=entity;console.log(JSON.stringify(entity.labels.zh)==='{"language":"zh","value":"世界人口"}');});

	CeL.wiki.data('P6', function(entity) {result=entity;console.log(JSON.stringify(entity.labels.zh)==='{"language":"zh","value":"政府首长"');});

	CeL.wiki.data('宇宙', '形狀', function(entity) {result=entity;console.log(entity==='宇宙的形狀');})
	CeL.wiki.data('荷马', '出生日期', function(entity) {result=entity;console.log(''+entity==='前8世紀');})
	CeL.wiki.data('荷马', function(entity) {result=entity;console.log(CeL.wiki.entity.value_of(entity.claims.P1477)==='Ὅμηρος');})
	CeL.wiki.data('艾薩克·牛頓', '出生日期', function(entity) {result=entity;console.log(''+entity==='1643年1月4日,1642年12月25日');})

	// 實體項目值的鏈接數據界面 (無法篩選所要資料，傳輸量較大。)
	// 非即時資料!
	CeL.get_URL('https://www.wikidata.org/wiki/Special:EntityData/Q1.json',function(r){r=JSON.parse(r.responseText);console.log(r.entities.Q1.labels.zh.value)})

	// ------------------------------------------------------------------------

	wiki = CeL.wiki.login(user_name, pw, 'wikidata');
	wiki.data(id, function(entity){}, {is_key:true}).edit_data(function(entity){});
	wiki.page('title').data(function(entity){}, options).edit_data().edit()

	wiki = Wiki(true)
	wiki.page('宇宙').data(function(entity){result=entity;console.log(entity);})

	wiki = Wiki(true, 'wikidata');
	wiki.data('宇宙', function(entity){result=entity;console.log(entity.labels['en'].value==='universe');})
	wiki.data('宇宙', '形狀', function(entity){result=entity;console.log(entity==='宇宙的形狀');})
	wiki.query('CLAIM[31:14827288] AND CLAIM[31:593744]', function(entity) {result=entity;console.log(entity.labels['zh-tw'].value==='維基資料');})

	</code>
	 * 
	 * @param {String|Array}key
	 *            entity id. 欲取得之特定實體id。 e.g., 'Q1', 'P6'
	 * @param {String}[property]
	 *            取得特定屬性值。
	 * @param {Function}[callback]
	 *            回調函數。 callback(轉成JavaScript的值)
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * 
	 * @see https://www.mediawiki.org/wiki/Wikibase/DataModel/JSON
	 */
	function wikidata_entity(key, property, callback, options) {
		if (typeof property === 'function' && !options) {
			// shift arguments.
			options = callback;
			callback = property;
			property = null;
		}

		if (typeof options === 'string') {
			options = {
				props : options
			};
		} else if (typeof options === 'function') {
			options = {
				filter : options
			};
		} else {
			// 正規化並提供可隨意改變的同內容參數，以避免修改或覆蓋附加參數。
			options = library_namespace.new_options(options);
		}

		var API_URL = get_data_API_URL(options);
		if (false) {
			console.log('wikidata_entity: get_data_API_URL API_URL : '
					+ API_URL);
		}

		// ----------------------------
		// convert property: title to id
		if (typeof property === 'string' && !/^P\d{1,5}$/.test(property)) {
			if (library_namespace.is_debug(2)
					&& /^(?:(?:info|sitelinks|sitelinks\/urls|aliases|labels|descriptions|claims|datatype)\|)+$/
							.test(property + '|'))
				library_namespace.warn(
				//
				'wikidata_entity: 您或許該採用 options.props = ' + property);
			/** {String}setup language of key and property name. 僅在需要 search 時使用。 */
			property = [ wikidata_get_site(options, true) || default_language,
					property ];
		}

		// console.log('property: ' + property);
		if (is_api_and_title(property, 'language')) {
			// TODO: property 可能是 [ language code, 'labels|aliases' ] 之類。
			property = wikidata_search.use_cache(property, function(id, error) {
				wikidata_entity(key, id, callback, options);
			}, options);
			if (!property) {
				// assert: property === undefined
				// Waiting for conversion.
				return;
			}
		}

		// ----------------------------
		// convert key: title to id
		if (typeof key === 'number') {
			key = [ key ];
		} else if (typeof key === 'string'
				&& !/^[PQ]\d{1,10}(\|[PQ]\d{1,10})*$/.test(key)) {
			/** {String}setup language of key and property name. 僅在需要 search 時使用。 */
			key = [ wikidata_get_site(options, true) || default_language, key ];
		}

		if (Array.isArray(key)) {
			if (is_api_and_title(key)) {
				if (is_wikidata_site(key[0])) {
					key = {
						site : key[0],
						title : key[1]
					};

				} else {
					wikidata_search(key, function(id) {
						if (id) {
							library_namespace.debug(
							//
							'entity ' + id + ' ← [[:' + key.join(':') + ']]',
									1, 'wikidata_entity');
							wikidata_entity(id, property, callback, options);
							return;
						}

						// 可能為重定向頁面？
						// 例如要求 "A of B" 而無此項，
						// 但 [[en:A of B]]→[[en:A]] 且存在 "A"，則會回傳本"A"項。
						wiki_API.page(key.clone(), function(page_data) {
							var content = get_page_content(page_data),
							// 測試檢查是否為重定向頁面。
							redirect = parse_redirect(content);
							if (redirect) {
								library_namespace.info(
								//
								'wikidata_entity: 處理重定向頁面: [[:' + key.join(':')
										+ ']] → [[:' + key[0] + ':' + redirect
										+ ']]。');
								wikidata_entity([ key[0],
								// normalize_page_name():
								// 此 API 無法自動轉換首字大小寫之類！因此需要自行正規化。
								normalize_page_name(redirect) ], property,
										callback, options);
								return;
							}

							library_namespace.error(
							//
							'wikidata_entity: Wikidata 不存在/已刪除 [[:'
									+ key.join(':') + ']] 之數據，'
									+ (content ? '但' : '且無法取得/不')
									+ '存在此 Wikipedia 頁面。無法處理此 Wikidata 數據要求。');
							callback(undefined, 'no_key');
						});

					}, {
						API_URL : API_URL,
						get_id : true,
						limit : 1
					});
					// Waiting for conversion.
					return;
				}

			} else {
				key = key.map(function(id) {
					if (/^[PQ]\d{1,10}$/.test(id))
						return id;
					if (library_namespace.is_digits(id))
						return 'Q' + id;
					library_namespace.warn(
					//
					'wikidata_entity: Invalid id: ' + id);
					return '';
				}).join('|');
			}
		}

		// ----------------------------

		if (!key || library_namespace.is_empty_object(key)) {
			library_namespace.error('wikidata_entity: 未設定欲取得之特定實體id。');
			callback(undefined, 'no_key');
			return;
		}

		// 實體項目 entity
		// https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q1&props=labels&utf8=1
		// TODO: claim/聲明/屬性/分類/陳述/statement
		// https://www.wikidata.org/w/api.php?action=wbgetclaims&ids=P1&props=claims&utf8=1
		// TODO: 維基百科 sitelinks
		// https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q1&props=sitelinks&utf8=1
		var action;
		// 不採用 get_page_content.is_page_data(key)
		// 以允許自行設定 {title:title,language:language}。
		if (key.title) {
			action = 'sites='
					+ (key.site || key.language
							&& language_to_site_name(key.language) || wikidata_get_site(options))
					+ '&titles=' + encodeURIComponent(key.title);
		} else {
			action = 'ids=' + key;
		}
		library_namespace.debug('action: [' + action + ']', 2,
				'wikidata_entity');
		// https://www.wikidata.org/w/api.php?action=help&modules=wbgetentities
		action = [ API_URL, 'wbgetentities&' + action ];

		if (property && !('props' in options)) {
			options.props = 'claims';
		}
		var props = options.props;
		if (Array.isArray(props)) {
			props = props.join('|');
		}
		// 可接受 "props=" (空 props)。
		if (props || props === '') {
			// retrieve properties. 僅擷取這些屬性。
			action[1] += '&props=' + props;
			if (props.includes('|')) {
				// 對於多種屬性，不特別取之。
				props = null;
			}
		}
		if (options.languages) {
			// retrieve languages, language to callback. 僅擷取這些語言。
			action[1] += '&languages=' + options.languages;
		}
		// console.log(options);
		// console.log(action);

		// console.log('wikidata_entity: API_URL: ' + API_URL);
		// console.log('wikidata_entity: action: ' + action);
		// console.log(arguments);
		// TODO:
		wiki_API.query(action, function(data) {
			var error = data && data.error;
			// 檢查伺服器回應是否有錯誤資訊。
			if (error) {
				if (error.code === 'param-missing') {
					library_namespace.error(
					/**
					 * 可能是錯把 "category" 之類當作 sites name??
					 * 
					 * wikidata_entity: [param-missing] A parameter that is
					 * required was missing. (Either provide the item "ids" or
					 * pairs of "sites" and "titles" for corresponding pages)
					 */
					'wikidata_entity: 未設定欲取得之特定實體id。請確定您的要求，尤其是 sites 存在: '
							+ decodeURI(action[0]));
				} else {
					library_namespace.error('wikidata_entity: ['
					//
					+ error.code + '] ' + error.info);
				}
				callback(undefined, error);
				return;
			}

			// data:
			// {entities:{Q1:{pageid:129,lastrevid:0,id:'P1',labels:{},claims:{},...},P1:{id:'P1',missing:''}},success:1}
			// @see https://www.mediawiki.org/wiki/Wikibase/DataModel/JSON
			// @see https://www.wikidata.org/wiki/Special:ListDatatypes
			if (data && data.entities) {
				data = data.entities;
				var list = [];
				for ( var id in data) {
					list.push(data[id]);
				}
				data = list;
				if (data.length === 1) {
					data = data[0];
					if (props && (props in data)) {
						data = data[props];
					} else {
						if (get_page_content.is_page_data(key)) {
							library_namespace.debug(data.id + ' 對應頁面: '
									+ get_page_title_link(key), 1,
									'wikidata_entity');
							data[KEY_CORRESPOND_PAGE] = key;
						}
						// assert: KEY_get_entity_value, KEY_SESSION
						// is NOT in data
						Object.defineProperty(data, KEY_get_entity_value, {
							value : wikidata_entity_value
						});
						if (options && options[KEY_SESSION]) {
							// for .resolve_item
							data[KEY_SESSION] = options[KEY_SESSION];
						}
					}
				}
			}

			if (property && data) {
				property = data.claims
				//
				? data.claims[property] : data[property];
			}
			if (property) {
				wikidata_datavalue(property, callback, options);
			} else {
				callback(data);
			}
		}, null, options);
	}

	/**
	 * 取得特定屬性值。
	 * 
	 * @param {String}[property]
	 *            取得特定屬性值。
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * @param {Function}[callback]
	 *            回調函數。 callback(轉成JavaScript的值)
	 * 
	 * @returns 屬性的值
	 * 
	 * @inner
	 */
	function wikidata_entity_value(property, options, callback) {
		if (Array.isArray(property)) {
			// e.g., entity.value(['property','property'])
			var property_list = property;
			property = Object.create(null);
			property_list.forEach(function(key) {
				property[key] = null;
			});
		}
		if (library_namespace.is_Object(property)) {
			// e.g., entity.value({'property':'language'})
			if (callback) {
				;
			}
			// TODO: for callback
			for ( var key in property) {
				var _options = property[key];
				if (typeof _options === 'string'
						&& PATTERN_PROJECT_CODE_i.test(_options)) {
					_options = Object.assign({
						language : _options.toLowerCase()
					}, options);
				} else {
					_options = options;
				}
				property[key] = wikidata_entity_value.call(this, key, _options);
			}
			return property;
		}

		var value, language = wikidata_get_site(options, true)
				|| default_language, matched = typeof property === 'string'
				&& property.match(/^P(\d+)$/i);

		if (matched) {
			property = +matched[1];
		}

		if (property === 'label') {
			value = this.labels && this.labels[language];
		} else if (property === 'alias') {
			value = this.aliases && this.aliases[language];
		} else if (property === 'sitelink') {
			value = this.sitelinks && this.sitelinks[language];
		} else if (typeof property === 'number') {
			value = this.claims && this.claims['P' + property];
		} else if (value = wikidata_search.use_cache(property, Object.assign({
			type : 'property'
		}, options))) {
			// 一般 property
			value = this.claims && this.claims[value];
		} else {
			library_namespace
					.error('wikidata_entity_value: Can not deal with property ['
							+ property + ']');
			return;
		}

		if (options && options.resolve_item) {
			value = wikidata_datavalue(value);
			if (Array.isArray(value)) {
				// 有的時候因為操作錯誤，所以會有相同的屬性值。但是這一種情況應該要更正原資料。
				// value = value.unique();
			}
			this[KEY_SESSION].host.data(value, callback);
			return value;
		}

		return wikidata_datavalue(value, callback, options);
	}

	// ------------------------------------------------------------------------

	// test if is Q4167410: Wikimedia disambiguation page 維基媒體消歧義頁
	// [[Special:链接到消歧义页的页面]]: 頁面內容含有 __DISAMBIG__ (或別名) 標籤會被作為消歧義頁面。
	// CeL.wiki.data.is_DAB(entity)
	function is_DAB(entity, callback) {
		var property = entity && entity.claims && entity.claims.P31;
		if (property && wikidata_datavalue(property) === 'Q4167410') {
			if (callback) {
				callback(true, entity);
				return;
			}
			return true;
		}
		if (!callback) {
			return;
		}

		// wikidata 的 item 或 Q4167410 需要手動加入，非自動連結。
		// 因此不能光靠 Q4167410 準確判定是否為消歧義頁。其他屬性相同。
		// 準確判定得自行檢查原維基之資訊，例如檢查 action=query&prop=info。

		// 基本上只有 Q(entity, 可連結 wikipedia page) 與 P(entity 的屬性) 之分。
		// 再把各 wikipedia page 手動加入 entity 之 sitelink。

		// TODO: 檢查 __DISAMBIG__ page property

		// TODO: 檢查 [[Category:All disambiguation pages]]

		// TODO: 檢查標題是否有 "(消歧義)" 之類。

		// TODO: 檢查
		// https://en.wikipedia.org/w/api.php?action=query&titles=title&prop=pageprops
		// 看看是否 ('disambiguation' in page_data.pageprops)；
		// 這方法即使在 wikipedia 沒 entity 時依然有效。
		callback(null, entity);
	}

	// ------------------------------------------------------------------------

	// TODO: 自 root 開始尋找所有的 property
	function property_tree(root, property, callback, options) {
		if (typeof options === 'string') {
			options = {
				retrieve : options
			};
		} else {
			options = library_namespace.setup_options(options);
		}

		var entity_now = root,
		// 擷取具有代表性的特性。 label/sitelink/property/entity
		retrieve = options.retrieve || 'label',
		//
		tree = [];

		function next_entity() {
			wikidata_entity(entity_now, function() {
				;
			});
		}

		next_entity();
	}

	// ------------------------------------------------------------------------

	// export 導出.
	Object.assign(wikidata_entity, {
		search : wikidata_search,
		// 標籤
		label_of : get_entity_label,
		// 標題
		title_of : get_entity_link,
		value_of : wikidata_datavalue,
		is_DAB : is_DAB,

		// CeL.wiki.data.include_label()
		include_label : include_label
	});

	// ------------------------------------------------------------------------

	// P143 (導入自, imported from) for bot, P248 (載於, stated in) for humans
	// + 來源網址 (P854) reference URL
	// + 檢索日期 (P813) retrieved date

	// @see wikidata_search_cache
	// wikidata_datatype_cache.P31 = {String}datatype of P31;
	var wikidata_datatype_cache = Object.create(null);

	// callback(datatype of property, error)
	function wikidata_datatype(property, callback, options) {
		if (is_api_and_title(property, 'language')) {
			property = wikidata_search.use_cache(property, function(id, error) {
				wikidata_datatype(id, callback, options);
			}, Object.assign(Object.create(null),
					wikidata_search.use_cache.default_options, options));
			if (!property) {
				// assert: property === undefined
				// Waiting for conversion.
				return;
			}
		}

		if (property > 0) {
			property = 'P' + property;
		}
		if (!/^P\d{1,5}$/.test(property)) {
			callback(undefined, 'wikidata_datatype: Invalid property: ['
					+ property + ']');
			return;
		}

		var datatype = wikidata_datatype_cache[property];
		if (datatype) {
			callback(datatype);
			return;
		}

		var action = [ get_data_API_URL(options),
		// https://www.wikidata.org/w/api.php?action=wbgetentities&props=datatype&ids=P7
		'wbgetentities&props=datatype&ids=' + property ];
		wiki_API.query(action, function(data) {
			var error = data && data.error;
			// 檢查伺服器回應是否有錯誤資訊。
			if (error) {
				library_namespace.error('wikidata_datatype: ['
				//
				+ error.code + '] ' + error.info);
				callback(undefined, error);
				return;
			}

			// data =
			// {"entities":{"P7":{"type":"property","datatype":"wikibase-item","id":"P7"}},"success":1}
			// data.entities[property].datatype
			if (!(data = data.entities) || !(data = data[property])) {
				callback(undefined, 'Invalid/Unknown return for [' + property
						+ ']');
				return;
			}

			library_namespace.debug('datatype of property [' + property
					+ ']: [' + data.datatype + ']', 1, 'wikidata_datatype');
			// cache
			wikidata_datatype_cache[property] = data.datatype;
			callback(data.datatype);
		}, null, options);
	}

	// ------------------------------------------------------------------------

	// auto-detect if are multiple values
	function is_multi_wikidata_value(value, options) {
		return value === wikidata_edit.remove_all ? false
		//
		: 'multi' in options ? options.multi
		// auto-detect: guess if is multi
		: Array.isArray(value)
		// 去除經緯度+高度的情形。
		&& (value.length !== 2 || value.length !== 3
		//
		|| typeof value[0] !== 'number' || typeof value[1] !== 'number');
	}

	// https://github.com/DataValues/Number/blob/master/src/DataValues/DecimalValue.php#L43
	// const QUANTITY_VALUE_PATTERN = '/^[-+]([1-9]\d*|\d)(\.\d+)?\z/';

	// return quantity acceptable by wikidata API ({String}with sign)
	// https://www.wikidata.org/wiki/Help:Statements#Quantitative_values
	// https://phabricator.wikimedia.org/T119226
	function wikidata_quantity(value, unit) {
		// assert: typeof value === 'number'
		value = +value;
		// TODO: 極大極小值。
		// 負數已經自動加上 "-"
		return value < 0 ? String(value) : '+' + value;
	}

	/**
	 * 盡可能模擬 wikidata (wikibase) 之 JSON 資料結構。
	 * 
	 * TODO: callback
	 * 
	 * @param value
	 *            要解析的值
	 * @param {String}[datatype]
	 *            資料型別
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * 
	 * @returns {Object}wikidata (wikibase) 之 JSON 資料結構。
	 * 
	 * @see https://www.wikidata.org/w/api.php?action=help&modules=wbparsevalue
	 *      https://www.mediawiki.org/wiki/Wikibase/API#wbparsevalue
	 *      https://phabricator.wikimedia.org/T112140
	 */
	function normalize_wikidata_value(value, datatype, options, to_pass) {
		if (library_namespace.is_Object(datatype) && options === undefined) {
			// 輸入省略了datatype。
			// input: normalize_wikidata_value(value, options)
			options = datatype;
			datatype = undefined;
		} else if (typeof options === 'string' && /^P\d{1,5}$/i.test(options)) {
			options = {
				property : options
			};
		} else if (typeof options === 'string'
				&& PATTERN_PROJECT_CODE_i.test(options)) {
			options = {
				language : options.toLowerCase()
			};
		} else {
			options = library_namespace.setup_options(options);
		}

		var is_multi = is_multi_wikidata_value(value, options);
		// console.trace('is_multi: ' + is_multi + ', value: ' + value);
		if (is_multi) {
			if (!Array.isArray(value)) {
				value = [ value ];
			}
			// 正規化並提供可隨意改變的同內容參數，以避免修改或覆蓋附加參數。
			options = library_namespace.new_options(options);
			delete options.multi;
			var left = value.length, callback = options.callback;
			options.callback = function(normalized_data, index) {
				if (!(0 <= index && index < value.length)) {
					throw 'normalize_wikidata_value: Invalid index: ' + index;
				}
				library_namespace.debug('Set [' + index + ']: '
						+ JSON.stringify(normalized_data), 3,
						'normalize_wikidata_value');
				// console.log(normalized_data);
				value[index] = normalized_data;
				if (--left === 0 && typeof callback === 'function') {
					callback(value, to_pass);
				}
			};
			value = value.map(function(v, index) {
				return normalize_wikidata_value(v, datatype, options, index);
			});
			return value;
		}

		// --------------------------------------

		if (!datatype && options.property
				&& typeof options.callback === 'function'
				&& (!('get_type' in options) || options.get_type)) {
			// 先取得/確認指定 property 之 datatype。
			wikidata_datatype(options.property, function(datatype) {
				var matched = datatype
						&& datatype.match(/^wikibase-(item|property)$/);
				if (matched && !/^[PQ]\d{1,10}$/.test(value)) {
					library_namespace.debug('將屬性名稱轉換成 id。'
							+ JSON.stringify(value), 3,
							'normalize_wikidata_value');
					// console.log(options);
					wikidata_search.use_cache(value, function(id, error) {
						normalize_wikidata_value(
						//
						id || 'Nothing found: [' + value + ']', datatype,
								options, to_pass);
					}, Object.assign(Object.create(null),
					// 因wikidata_search.use_cache.default_options包含.type設定，必須將特殊type設定放在匯入default_options後!
					wikidata_search.use_cache.default_options, {
						type : matched[1],
						// 警告:若是設定must_callback=false，會造成程序不callback而中途跳出!
						must_callback : true
					}, options));
				} else {
					normalize_wikidata_value(value, datatype || NOT_FOUND,
							options, to_pass);
				}
			}, options);
			return;
		}

		// --------------------------------------
		// 處理單一項目
		var snaktype, datavalue_type, error;

		function normalized() {
			var normalized_data = {
				snaktype : snaktype || 'value'
			};
			if (options.property) {
				normalized_data.property = options.property;
			}
			if (options.hash) {
				normalized_data.hash = options.hash;
			}
			if (datatype) {
				normalized_data.datavalue = {
					value : value,
					type : datavalue_type
				};
				normalized_data.datatype = datatype;
			}
			if (error) {
				library_namespace.error(error);
				normalized_data.error = error;
			}

			// console.log(JSON.stringify(normalized_data));
			// console.log(normalized_data);
			if (typeof options.callback === 'function') {
				options.callback(normalized_data, to_pass);
			}
			return normalized_data;
		}

		// delete: {P1:CeL.wiki.edit_data.remove_all}
		// delete: {P1:value,remove:true}
		// snaktype novalue 無數值: {P1:null}
		// snaktype somevalue 未知數值: {P1:CeL.wiki.edit_data.somevalue}
		// snaktype value: {P1:...}

		if (value === null) {
			snaktype = 'novalue';
			return normalized();
		}

		if (value === wikidata_edit.somevalue) {
			snaktype = 'somevalue';
			return normalized();
		}

		if (datatype === NOT_FOUND) {
			// 例如經過 options.get_type 卻沒找到。
			// 因為之前應該已經顯示過錯誤訊息，因此這邊直接放棄作業。
			return normalized();
		}

		// --------------------------------------
		// 處理一般賦值

		if (!datatype) {
			// auto-detect: guess datatype

			// https://www.wikidata.org/w/api.php?action=help&modules=wbparsevalue
			// https://www.wikidata.org/w/api.php?action=wbgetentities&ids=P3088&props=datatype
			// +claims:P1793
			//
			// url: {P856:"https://url"}, {P1896:"https://url"}
			// monolingualtext: {P1448:"text"} ← 自動判別language,
			// monolingualtext: {P1448:"text",language:"zh-tw"}
			// string: {P1353:"text"}
			// external-id: {P212:'id'}
			// math: {P2534:'1+2'}
			// commonsMedia: {P18:'file.svg'}
			//
			// quantity: {P1114:0}
			// time: {P585:new Date} date.precision=1
			// wikibase-item: {P1629:Q1}
			// wikibase-property: {P1687:P1}
			// globe-coordinate 經緯度:
			// {P625: [ {Number}latitude 緯度, {Number}longitude 經度 ]}

			if (typeof value === 'number') {
				datatype = 'quantity';
			} else if (Array.isArray(value)
					&& (value.length === 2 || value.length === 3)) {
				datatype = 'globe-coordinate';
			} else if (library_namespace.is_Date(value)) {
				datatype = 'time';
			} else {
				value = String(value);
				var matched = value.match(/^([PQ])(\d{1,10})$/i);
				if (matched) {
					datatype = /^[Qq]$/.test(matched[1]) ? 'wikibase-item'
							: 'wikibase-property';
				} else if ('language' in options) {
					datatype = 'monolingualtext';
				} else if (/^(?:https?|ftp):\/\//i.test(value)) {
					datatype = 'url';
				} else if (/\.(?:jpg|png|svg)$/i.test(value)) {
					datatype = 'commonsMedia';
				} else {
					// TODO: other types: external-id, math
					datatype = 'string';
				}
			}
			// console.log('guess datatype: ' + datatype + ', value: ' + value);
		}

		// --------------------------------------

		if (typeof value === 'object' && value.snaktype && value.datatype) {
			// 若 value 已經是完整的 wikidata object，則直接回傳之。
			if (datatype !== value.datatype) {
				library_namespace.error(
				// 所指定的與 value 的不同。
				'normalize_wikidata_value: The datatype of the value ['
						+ value.datatype + '] is different from specified: ['
						+ datatype + ']');
			}

			if (typeof options.callback === 'function') {
				options.callback(value, to_pass);
			}
			return value;
		}

		// --------------------------------------
		// 依據各種不同的datatype生成結構化資料。

		switch (datatype) {
		case 'globe-coordinate':
			datavalue_type = 'globecoordinate';
			value = {
				latitude : +value[0],
				longitude : +value[1],
				altitude : typeof value[2] === 'number' ? value[2] : null,
				precision : options.precision || 0.000001,
				globe : options.globe || 'http://www.wikidata.org/entity/Q2'
			};
			break;

		case 'monolingualtext':
			datavalue_type = datatype;
			value = {
				text : value,
				language : wikidata_get_site(options, true)
						|| guess_language(value)
			};
			// console.log('use language: ' + value.language);
			break;

		case 'quantity':
			datavalue_type = datatype;
			var unit = options.unit || 1;
			value = wikidata_quantity(value);
			value = {
				amount : value,
				// e.g., 'http://www.wikidata.org/entity/Q857027'
				unit : String(unit),
				upperBound : typeof options.upperBound === 'number' ? wikidata_quantity(options.upperBound)
						: value,
				lowerBound : typeof options.lowerBound === 'number' ? wikidata_quantity(options.lowerBound)
						: value
			};
			break;

		case 'time':
			datavalue_type = datatype;
			var precision = options.precision;
			// 規範日期。
			if (!library_namespace.is_Date(value)) {
				var date_value;
				// TODO: 解析各種日期格式。
				if (value && isNaN(date_value = Date.parse(value))) {
					// Warning:
					// String_to_Date()只在有載入CeL.data.date時才能用。但String_to_Date()比parse_date()功能大多了。
					date_value = library_namespace.String_to_Date(value, {
						// 都必須當作UTC+0，否則被轉換成UTC+0時會出現偏差。
						zone : 0
					});
					if (date_value) {
						if (('precision' in date_value)
						//
						&& (date_value.precision in INDEX_OF_PRECISION)) {
							precision = INDEX_OF_PRECISION[date_value.precision];
						}
						date_value = date_value.getTime();
					} else {
						date_value = parse_date(value, true) || NaN;
					}
				}
				if (isNaN(date_value)) {
					error = 'Invalid Date: [' + value + ']';
				} else {
					// TODO: 按照date_value設定.precision。
					value = new Date(date_value);
				}
			} else if (isNaN(value.getTime())) {
				error = 'Invalid Date';
			}

			if (isNaN(precision)) {
				precision = INDEX_OF_PRECISION.day;
			}
			if (error) {
				value = String(value);
			} else {
				if (precision === INDEX_OF_PRECISION.day) {
					// 當 precision=INDEX_OF_PRECISION.day 時，時分秒*必須*設置為 0!
					value.setUTCHours(0, 0, 0, 0);
				}
				value = value.toISOString();
			}
			value = {
				// Data value corrupt: $timestamp must resemble ISO 8601, given
				time : value
				// '2000-01-01T00:00:00.000Z' → '2000-01-01T00:00:00Z'
				.replace(/\.\d{3}Z$/, 'Z')
				// '2000-01-01T00:00:00Z' → '+2000-01-01T00:00:00Z'
				.replace(/^(\d{4}-)/, '+$1'),
				timezone : options.timezone || 0,
				before : options.before || 0,
				after : options.after || 0,
				precision : precision,
				calendarmodel : options.calendarmodel
				// proleptic Gregorian calendar:
				|| 'http://www.wikidata.org/entity/Q1985727'
			};
			break;

		case 'wikibase-item':
		case 'wikibase-property':
			datavalue_type = 'wikibase-entityid';
			// console.log(value);
			var matched = typeof value === 'string'
					&& value.match(/^([PQ])(\d{1,10})$/i);
			if (matched) {
				value = {
					'entity-type' : datatype === 'wikibase-item' ? 'item'
							: 'property',
					'numeric-id' : matched[2] | 0,
					// 在設定時，id這項可省略。
					id : value
				};
			} else {
				error = 'normalize_wikidata_value: Illegal ' + datatype + ': '
						+ JSON.stringify(value);
			}
			break;

		case 'commonsMedia':
		case 'url':
		case 'external-id':
		case 'math':
		case 'string':
			datavalue_type = 'string';
			// Data value corrupt: Can only construct StringValue from strings
			value = String(value);
			break;

		default:
			error = 'normalize_wikidata_value: Unknown datatype [' + datatype
					+ '] and value [' + JSON.stringify(value) + ']';
			return;
		}

		return normalized();
	}

	/**
	 * @inner only for set_claims()
	 */
	var entity_properties = {
		// 值的部分為單純表達意思用的內容結構，可以其他的值代替。
		pageid : 1,
		ns : 0,
		title : 'Q1',
		lastrevid : 1,
		modified : '2000-01-01T00:00:00Z',
		type : 'item',
		id : 'Q1',
		labels : [],
		descriptions : [],
		aliases : [],
		claims : [],
		sitelinks : []
	},
	//
	KEY_property_options = 'options',
	/**
	 * 放置不應該成為 key 的一些屬性名稱
	 * 
	 * @inner only for set_claims()
	 */
	claim_properties = {
		// 值的部分為單純表達意思用的內容結構，可以其他的值代替。
		// mainsnak : {},
		// snaktype : '',
		// datavalue : {},
		// id : '',
		type : '',
		rank : '',
		language : '',
		// 警告: 此屬性應置於個別 claim 中。
		remove : true,
		// additional_properties, KEY_property_options
		// options : {},
		multi : true,
		references : []
	};

	// example 1:
	//
	// {Object}可接受的原始輸入形式之一
	// {載於:'宇宙',導入自:'zhwiki',來源網址:undefined,臺灣物種名錄物種編號:{value:123,remove:true},language:'zh',references:{...}}+exists_property_hash
	//
	// {Array}可接受的原始輸入形式之2: 直接轉換為{Array}陣列
	// [{載於:'宇宙',導入自:'zhwiki',來源網址:undefined,臺灣物種名錄物種編號:{value:123,remove:true},language:'zh',references:{...}}]
	// +exists_property_hash
	//
	// {Array}可接受的原始輸入形式之2'
	// 分析每一個個別的{Object}項目，將{Object}簡易的屬性雜湊轉換成{Array}屬性名稱列表。這期間可能會改變要求項目的項目數 →
	// [{載於:'宇宙',options:AP},{導入自:'zhwiki',options:AP},{來源網址:undefined,options:AP},{臺灣物種名錄物種編號:123,remove:true,options:AP}]
	// + additional_properties: AP={language:'zh',references:{...}}
	// + exists_property_hash
	// * {Object|Array}AP.references 當作個別{Object} properties 項目的參照。
	// * 若某項有 .mainsnak 或 .snaktype 則當作輸入了全套完整的資料，不處理此項。
	//
	// {Array}可接受的原始輸入形式之3
	// 將{Array}屬性名稱列表轉換成{Array}屬性id列表 →
	// [{P248:'宇宙',property:'P248'},{P143:'zhwiki',property:'P143'},{P854:undefined,property:'P854'},{P3088:123,remove:true,property:'P3088'}]
	// + additional_properties + exists_property_hash
	//
	// 去掉 exists_property_hash 已有、重複者。
	// 處理 remove:true & remove all。
	//
	// get datatype of each property →
	// [{P248:'Q1'},{P143:'Q30239'},{P854:undefined},{P3088:123,remove:true}]
	// + additional_properties + exists_property_hash
	//
	// normalize property data value →
	// [{P248:{normalized value of P248}},{P143:{normalized value of P143}}
	// ,{property:P854,remove:true,value:undefined},{property:P3088,remove:true,value:123}]
	// + additional_properties
	//
	// 去掉殼 → data = [{normalized value of P248},{normalized value of P143}
	// ,{property:P854,remove:true,value:undefined},{property:P3088,remove:true,value:123}]
	// .additional=additional_properties
	//
	// callback(data)

	// example 2:
	//
	// [{生物俗名:['SB2#1','SB2#2','SB2#3'],multi:true,language:'zh-tw',references:{臺灣物種名錄物種編號:123456}},
	// {読み仮名 : 'かな',language : 'ja',references : {imported_from : 'jawiki'}}]
	// +exists_property_hash
	//
	// {Array}可接受的原始輸入形式之2'
	// 分析每一個個別的{Object}項目，將{Object}簡易的屬性雜湊轉換成{Array}屬性名稱列表。這期間可能會改變要求項目的項目數 →
	// [{生物俗名:'SB2#1',options:AP1},{生物俗名:'SB2#2',options:AP1},{生物俗名:'SB2#3',options:AP1},
	// {読み仮名 : 'かな',options(KEY_property_options):AP2}]
	// +additional_properties:AP1={language:'zh-tw',references:{臺灣物種名錄物種編號:123456}}
	// +additional_properties:AP2={language:'ja',references:{imported_from:'jawiki'}}

	/**
	 * 規範化屬性列表。
	 * 
	 * @param {Object|Array}properties
	 *            要轉換的屬性。
	 * @param {Function}callback
	 *            回調函數。 callback({Array}property list, error)
	 * @param {Object}[exists_property_hash]
	 *            已經存在的屬性雜湊。可以由 wikidata API 取得。
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 */
	function normalize_wikidata_properties(properties, callback,
			exists_property_hash, options) {
		// console.log(properties);
		// console.log(options);
		// console.trace('normalize_wikidata_properties');

		library_namespace.debug('normalize properties: '
				+ JSON.stringify(properties), 3,
				'normalize_wikidata_properties');

		// console.log('-'.repeat(40));
		// console.log(properties);

		if (library_namespace.is_Object(properties)) {
			// {Array}可接受的原始輸入形式之2: 直接轉換為{Array}陣列
			properties = [ properties ];

		} else if (!Array.isArray(properties)) {
			if (properties) {
				library_namespace
						.error('normalize_wikidata_properties: Invalid properties: '
								+ JSON.stringify(properties));
			}

			callback(properties);
			return;
		}

		// 分析每一個個別的{Object}項目，將{Object}簡易的屬性雜湊轉換成{Array}屬性名稱列表。這期間可能會改變要求項目的項目數

		// 索求、需要轉換的屬性名稱 property key
		var demands = [],
		// demands 對應的 property
		property_corresponding = [],
		//
		options_language = wikidata_get_site(options, true);

		// console.log(options_language);
		// console.log('-'.repeat(20));
		// console.log(properties);

		var old_properties = properties;
		properties = [];
		old_properties.forEach(function(property) {
			if (!property) {
				// Skip null property.
				return;
			}

			// e.g., property:{P1:'',P2:'',language:'zh',references:{}}
			// assert: library_namespace.is_Object(property)

			// * 若某項有 .mainsnak 或 .snaktype 則當作輸入了全套完整的資料，不處理此項。
			if (property.mainsnak || property.snaktype) {
				properties.push(property);
				// Skip it.
				return;
			}

			// [KEY_property_options]: additional properties
			// 參照用設定: 設定每個屬性的時候將參照的設定，包含如 .language 等。
			var additional_properties = property[KEY_property_options],
			//
			check = function(property_data) {
				var property_key = property_data.property;
				if (!/^[PQ]\d{1,10}$/.test(property_key)) {
					// 有些設定在建構property_data時尚存留於((property))，這時得要自其中取出。
					var language = property.language || additional_properties
							&& additional_properties.language
							|| options_language;
					// console.log(language);
					// throw language;
					demands.push(language ? [ language, property_key ]
							: property_key);
					property_corresponding.push(property_data);
				}
				properties.push(property_data);
			};

			// .property: property key
			if (property.property) {
				check(property);
				return;
			}

			// e.g.,
			// properties:{P1:'',P2:'',language:'zh',references:{}}
			// assert: library_namespace.is_Object(properties)

			// 將{Object}簡易的屬性雜湊轉換成{Array}屬性名稱列表 →
			// 因為需要動到不可回復的操作，因此不更動到原先的屬性。
			// 初始化
			additional_properties = Object.assign(Object.create(null),
					additional_properties);

			// console.log(property);

			// properties應該為{Array}屬性名稱/id列表陣列。
			// 將 參照用設定 設為空，以便之後使用。
			// 把應該用做參照用設定的移到 property[KEY_property_options]，
			// 其他的屬性值搬到新的 properties。
			for ( var key in property) {
				var value = property[key], language;
				if (key in claim_properties) {
					additional_properties[key] = value;

				} else if (key !== KEY_property_options) {
					if (library_namespace.is_Object(value)) {
						// convert language+value object
						if (value.language && ('value' in value)) {
							// e.g., {language:'ja',value:'日本'}
							value = [ value.language, value.value ];
						} else if ((language = Object.keys(value)).length === 1
						// e.g., {ja:'日本'}
						&& (language = language[0])) {
							value = [ language, value[language] ];
						}
					}

					// console.log(value);

					var is_multi = value !== wikidata_edit.remove_all
					//
					&& ('multi' in additional_properties
					//
					? additional_properties.multi
					//
					: is_multi_wikidata_value(value, property));
					if (is_multi) {
						// e.g., [ 'jawiki', ['日本', '米国'] ]
						if (is_api_and_title(value, 'language')
						// [ 'jawiki', '日本' ] 可能會混淆。
						&& Array.isArray(value[1])) {
							value = value[1].map(function(v) {
								// return [ value[0], v ];
								return {
									language : value[0],
									value : v
								};
							});
						}
						// console.log(value);

						// set multiple values
						(Array.isArray(value) ? value : [ value ])
						//
						.forEach(function(v) {
							var property_data = {
								// 將屬性名稱 property key 儲存在 .property
								property : key,
								value : v
							};
							property_data[KEY_property_options]
							//
							= additional_properties;
							check(property_data);
						});
					} else {
						var property_data = {
							// 將屬性名稱 property key 儲存在 .property
							property : key,
							value : value
						};
						property_data[KEY_property_options]
						//
						= additional_properties;
						check(property_data);
					}
				}
			}
			// 這應該僅用於指示本 property，因此處理過後已經無用。
			delete additional_properties.multi;
		});

		// console.log('-'.repeat(60));
		// console.log(properties);

		// Release memory. 釋放被占用的記憶體.
		old_properties = null;

		// --------------------------------------

		// 將{Array}屬性名稱列表轉換成{Array}屬性id列表 →

		// console.log(demands);
		wikidata_search.use_cache(demands, function(property_id_list) {
			// 將{Array}屬性名稱列表轉換成{Array}屬性id列表 →
			if (property_id_list.length !== property_corresponding.length) {
				throw new Error(
				//
				'normalize_wikidata_properties: property_id_list.length '
						+ property_id_list.length
						+ ' !== property_corresponding.length '
						+ property_corresponding.length);
			}
			property_id_list.forEach(function(id, index) {
				var property_data = property_corresponding[index];
				// id 可能為 undefined/null
				if (/^[PQ]\d{1,10}$/.test(id)) {
					if (!('value' in property_data)) {
						property_data.value
						//
						= property_data[property_data.property];
					}
					property_data.property = id;
				} else {
					library_namespace.error(
					//
					'normalize_wikidata_properties: Invalid property key: '
							+ JSON.stringify(property_data));
				}
			});

			function property_value(property_data) {
				return 'value' in property_data ? property_data.value
						: property_data[property_data.property];
			}

			// 跳過要刪除的。
			function property_to_remove(property_data) {
				if (!('remove' in property_data)
						&& property_data[KEY_property_options]
						&& ('remove' in property_data[KEY_property_options])) {
					if (typeof property_data[KEY_property_options].remove
					//
					=== 'function') {
						console.log(property_data[KEY_property_options]);
						throw new Error(
						//		
						'wikidata_search.use_cache: .remove is function');
					}
					property_data.remove
					// copy configuration.
					// 警告: 此屬性應置於個別 claim 中，而非放在參照用設定。
					// 注意: 這操作會更改 property_data!
					= property_data[KEY_property_options].remove;
				}

				if (property_data.remove
				// 為欲刪除之index。
				|| property_data.remove === 0) {
					return true;
				}
				var value = property_value(property_data);
				if (value === wikidata_edit.remove_all
				// 若遇刪除此屬性下所有值，必須明確指定 wikidata_edit.remove_all，避免錯誤操作。
				// && value === undefined
				) {
					// 正規化 property_data.remove: 若有刪除操作，必定會設定 .remove。
					// 注意: 這操作會更改 property_data!
					property_data.remove = wikidata_edit.remove_all;
					return true;
				}
			}

			// 去掉 exists_property_hash 已有、重複者。
			if (exists_property_hash) {
				// console.log(exists_property_hash);
				properties = properties.filter(function(property_data) {
					// 當有輸入exists_property_hash時，所有的相關作業都會在這段處理。
					// 之後normalize_next_value()不會再動到exists_property_hash相關作業。
					var property_id = property_data.property;
					if (!property_id) {
						// 在此無法處理。例如未能轉換 key 成 id。
						return true;
					}
					var value = property_value(property_data),
					//
					exists_property_list = exists_property_hash[property_id];
					// console.log(property_data);

					if (!(property_id in wikidata_datatype_cache)
							&& exists_property_list) {
						var datatype = exists_property_list[0]
								&& exists_property_list[0].mainsnak
								&& exists_property_list[0].mainsnak.datatype;
						if (datatype) {
							// 利用原有 datatype 加快速度。
							wikidata_datatype_cache[property_id] = datatype;
						}
					}

					if (property_to_remove(property_data)) {
						// 刪除時，需要存在此property才有必要處置。
						if (!exists_property_list) {
							library_namespace.debug('Skip ' + property_id
							//
							+ (value ? '=' + JSON.stringify(value) : '')
									+ ': 無此屬性id，無法刪除。', 1,
									'normalize_wikidata_properties');
							return false;
						}

						// ((true >= 0))
						if (typeof property_data.remove === 'number'
								&& property_data.remove >= 0) {
							if (property_data.remove in exists_property_list) {
								return true;
							}
							// 要刪除的值不存在。
							library_namespace.warn(
							//
							'normalize_wikidata_properties: Skip '
							//
							+ property_id
							//
							+ (value ? '=' + JSON.stringify(value) : '')
							//
							+ ': 不存在指定要刪除的 index ' + property_data.remove + '/'
									+ exists_property_list.length + '，無法刪除。');
							return false;
						}

						if (!property_data.remove || property_data.remove
						//
						=== wikidata_edit.remove_all) {
							return true;
						}

						if (property_data.remove !== true) {
							library_namespace.warn(
							//
							'normalize_wikidata_properties: Invalid .remove ['
							//
							+ property_data.remove + ']: ' + property_id
							//
							+ (value ? '=' + JSON.stringify(value) : '')
							//
							+ ', will still try to remove the property.');
							// property_data.remove = true;
						}

						// 直接檢測已有的 index，設定於 property_data.remove。
						// 若有必要刪除，從最後一個相符的刪除起。
						var duplicate_index = wikidata_datavalue.get_index(
								exists_property_list, value, -1);
						// console.log(exists_property_list);
						// console.log(duplicate_index);

						if (duplicate_index !== NOT_FOUND) {
							// delete property_data.value;
							property_data.remove = duplicate_index;
							return true;
						}
						// 要刪除的值不存在。
						library_namespace.debug(
						//
						'Skip ' + property_id
						//
						+ (value ? '=' + JSON.stringify(value)
						//
						+ ': 此屬性無此值，無法刪除。' : ': 無此屬性id，無法刪除。')
						//
						, 1, 'normalize_wikidata_properties');
						return false;
					}

					if (!exists_property_list) {
						// 設定值時，不存在此 property 即有必要處置。
						return true;
					}

					// 檢測是否已有此值。
					if (false) {
						console.log(wikidata_datavalue.get_index(
								exists_property_list, value, 0));
					}
					// 若有必要設定 references，從首個相符的設定起。
					var duplicate_index = wikidata_datavalue.get_index(
							exists_property_list, value);
					if (duplicate_index === NOT_FOUND) {
						return true;
					}

					// {Object|Array}property_data[KEY_property_options].references
					// 當作每個 properties 的參照。
					var references = 'references' in property_data
					//
					? property_data.references
							: property_data[KEY_property_options]
							//
							&& property_data[KEY_property_options].references;
					library_namespace.debug('Skip ' + property_id + '['
							+ duplicate_index + ']: 此屬性已存在相同值 [' + value + ']。'
							+ (references ? '但依舊處理其 references 設定。' : ''), 1,
							'normalize_wikidata_properties');
					if (typeof references === 'object') {
						// delete property_data.value;
						property_data.exists_index = duplicate_index;
						return true;
					}
					return false;
				});
			}

			var index = 0,
			//
			normalize_next_value = function() {
				library_namespace.debug(index + '/' + properties.length, 3,
						'normalize_next_value');
				if (index === properties.length) {
					library_namespace.debug(
							'done: 已經將可查到的屬性名稱轉換成屬性id。 callback(properties);',
							2, 'normalize_next_value');
					callback(properties);
					return;
				}

				var property_data = properties[index++];
				if (property_to_remove(property_data)) {
					// 跳過要刪除的。
					normalize_next_value();
					return;
				}

				// get datatype of each property →
				var language = property_data.language
						|| property_data[KEY_property_options]
						&& property_data[KEY_property_options].language
						|| options_language,
				//
				_options = Object.assign({
					// multi : false,
					callback : function(normalized_value) {
						if (Array.isArray(normalized_value)
								&& options.aoto_select) {
							// 採用首個可用的，最有可能是目標的。
							normalized_value.some(function(value) {
								if (value && !value.error
										&& value.datatype !== NOT_FOUND) {
									normalized_value = value;
									return true;
								}
							});
						}

						if (Array.isArray(normalized_value)
								|| normalized_value.error
								|| normalized_value.datatype === NOT_FOUND) {
							// 將無法轉換的放在 .error。
							if (properties.error) {
								properties.error.push(property_data);
							} else {
								properties.error = [ property_data ];
							}

							if (Array.isArray(normalized_value)) {
								library_namespace.error(
								// 得到多個值而非單一值
								'normalize_next_value: get multiple values instead of just one value: ['
										+ value + '] → '
										+ JSON.stringify(normalized_value));

							} else if (false && normalized_value.error) {
								// 之前應該已經在normalize_wikidata_value()顯示過錯誤訊息
								library_namespace
										.error('normalize_next_value: '
												+ normalized_value.error);
							}
							// 因為之前應該已經顯示過錯誤訊息，因此這邊直接放棄作業，排除此property。

							properties.splice(--index, 1);
							normalize_next_value();
							return;
						}

						if (false) {
							console.log('-'.repeat(60));
							console.log(normalized_value);
							console.log(property_data.property + ': '
							//
							+ JSON.stringify(exists_property_hash
							//
							[property_data.property]));
						}
						if (exists_property_hash[property_data.property]
						// 二次篩選:因為已經轉換/取得了 entity id，可以再次做確認。
						&& (normalized_value.datatype === 'wikibase-item'
						// and 已經轉換了 date time
						|| normalized_value.datatype === 'time')
						//
						&& wikidata_datavalue.get_index(
						//
						exists_property_hash[property_data.property],
						//
						normalized_value, 1)) {
							library_namespace.debug('Skip exists value: '
									+ value + ' ('
									+ wikidata_datavalue(normalized_value)
									+ ')', 1, 'normalize_next_value');
							// TODO: 依舊增添references
							properties.splice(--index, 1);
							normalize_next_value();
							return;
						}

						if (false) {
							// normalize property data value →
							property_data[property_data.property]
							//
							= normalized_value;
						}

						// console.log('-'.repeat(60));
						// console.log(normalized_value);
						// 去掉殼 →
						properties[index - 1] = normalized_value;
						// 複製/搬移需要用到的屬性。
						if (property_data.exists_index >= 0) {
							normalized_value.exists_index
							//
							= property_data.exists_index;
						}

						// *
						// {Object|Array}property_data[KEY_property_options].references
						// 當作每個 properties 的參照。
						var references = 'references' in property_data
						//
						? property_data.references
						//
						: property_data[KEY_property_options]
						//
						&& property_data[KEY_property_options].references;
						if (typeof references === 'object') {
							normalized_value.references = references;
						}

						normalize_next_value();
					},
					property : property_data.property
				}, options, property_data[KEY_property_options]);
				if (language) {
					_options.language = language;
				}

				// console.log('-'.repeat(60));
				// console.log(property_data);
				var value = property_value(property_data);
				// console.log('-'.repeat(60));
				// console.log(value);
				// console.log(_options);
				normalize_wikidata_value(value, property_data.datatype,
						_options);
			};

			normalize_next_value();

		}, Object.assign(Object.create(null),
				wikidata_search.use_cache.default_options, options));

	}

	// ----------------------------------------------------

	/**
	 * references: {Pid:value}
	 * 
	 * @inner only for set_claims()
	 */
	function set_references(GUID, property_data, callback, options, API_URL,
			session, exists_references) {

		normalize_wikidata_properties(property_data.references, function(
				references) {
			if (!Array.isArray(references)) {
				if (references) {
					library_namespace
							.error('set_references: Invalid references: '
									+ JSON.stringify(references));
				} else {
					// assert: 本次沒有要設定 claim 的資料。
				}
				callback();
				return;
			}

			// e.g., references:[{P1:'',language:'zh'},{P2:'',references:{}}]
			property_data.references = references;

			// console.log(references);

			// console.log(JSON.stringify(property_data.references));
			// console.log(property_data.references);

			var references = Object.create(null);
			property_data.references.forEach(function(reference_data) {
				references[reference_data.property] = [ reference_data ];
			});

			// console.log(JSON.stringify(references));
			// console.log(references);
			var POST_data = {
				statement : GUID,
				snaks : JSON.stringify(references)
			};

			if (options.reference_index >= 0) {
				POST_data.index = options.reference_index;
			}

			if (options.bot) {
				POST_data.bot = 1;
			}
			if (options.summary) {
				POST_data.summary = options.summary;
			}
			// TODO: baserevid, 但這需要每次重新取得 revid。

			// the token should be sent as the last parameter.
			POST_data.token = options.token;

			wiki_API.query([ API_URL, 'wbsetreference' ],
			// https://www.wikidata.org/w/api.php?action=help&modules=wbsetreference
			function(data) {
				// console.log(data);
				// console.log(JSON.stringify(data));
				var error = data && data.error;
				// 檢查伺服器回應是否有錯誤資訊。
				if (error) {
					// e.g., set_references: [failed-save] Edit conflict.
					library_namespace.error('set_references: [' + error.code
							+ '] ' + error.info);
				}
				// data =
				// {"pageinfo":{"lastrevid":1},"success":1,"reference":{"hash":"123abc..","snaks":{...},"snaks-order":[]}}
				callback(data, error);
			}, POST_data, session);

		}, exists_references
		// 確保會設定 .remove / .exists_index = duplicate_index。
		|| Object.create(null),
		//
		Object.assign({
			// [KEY_SESSION]
			session : session
		}));
	}

	/**
	 * remove/delete/刪除 property/claims
	 * 
	 * @inner only for set_claims()
	 */
	function remove_claims(exists_property_list, callback, options, API_URL,
			session, index) {
		if (index === wikidata_edit.remove_all) {
			// delete one by one
			index = exists_property_list.length;
			var remove_next_claim = function() {
				if (index-- > 0) {
					remove_claims(exists_property_list, remove_next_claim,
							options, API_URL, session, index);
				} else {
					callback();
				}
			};
			remove_next_claim();
			return;
		}

		library_namespace.debug('delete exists_property_list[' + index + ']: '
				+ JSON.stringify(exists_property_list[index]), 1,
				'remove_claims');
		var POST_data = {
			claim : exists_property_list[index].id
		};

		if (options.bot) {
			POST_data.bot = 1;
		}
		if (options.summary) {
			POST_data.summary = options.summary;
		}
		// TODO: baserevid, 但這需要每次重新取得 revid。

		// the token should be sent as the last parameter.
		POST_data.token = options.token;

		wiki_API.query([ API_URL, 'wbremoveclaims' ], function(data) {
			// console.log(data);
			var error = data && data.error;
			// 檢查伺服器回應是否有錯誤資訊。
			if (error) {
				library_namespace.error('remove_claims: [' + error.code + '] '
						+ error.info);
			}
			// data =
			// {pageinfo:{lastrevid:1},success:1,claims:['Q1$123-ABC']}
			callback(data);
		}, POST_data, session);
	}

	/**
	 * edit property/claims
	 * 
	 * @inner only for wikidata_edit()
	 */
	function set_claims(data, token, callback, options, session, entity) {
		library_namespace.debug('normalize data: ' + JSON.stringify(data), 3,
				'set_claims');

		if (!data.claims) {
			library_namespace.debug(
					'把所有不是正規屬性的當作是 claims property key，搬到 data.claims。'
							+ '正規屬性留在原處。', 5, 'set_claims');
			data.claims = Object.create(null);
			for ( var key in data) {
				if (!(key in entity_properties)) {
					data.claims[key] = data[key];
					delete data[key];
				}
			}
		}
		if (library_namespace.is_empty_object(data.claims)) {
			delete data.claims;
		}

		var POST_data = {
			entity : options.id || entity && entity.id,
			// placeholder 佔位符
			property : null,
			snaktype : null,
			value : null,
		},
		// action to set properties. 創建Wikibase陳述。
		// https://www.wikidata.org/w/api.php?action=help&modules=wbcreateclaim
		claim_action = [ get_data_API_URL(options), 'wbcreateclaim' ],
		// process to what index of {Array}claims
		claim_index = 0;

		if (!POST_data.entity) {
			// console.log(options);
			if (!options.title) {
				throw new Error('set_claims: No entity id specified!');
			}

			// 取得 id
			wikidata_entity({
				site : options.site,
				title : decodeURIComponent(options.title)
			}, function(_entity, error) {
				// console.log(_entity);
				options = Object.assign({
					id : _entity.id
				}, options);
				delete options.site;
				delete options.title;
				set_claims(data, token, callback,
				//
				options, session, entity && entity.claims ? entity : _entity);
			},
			// 若是未輸入entity，那就取得entity內容以幫助檢查是否已存在相同屬性值。
			entity && entity.claims ? {
				props : ''
			} : null);
			return;
		}

		if (!entity || !entity.claims) {
			library_namespace
					.debug('未輸入entity以供檢查是否已存在相同屬性值。', 1, 'set_claims');
		}

		// TODO: 可拆解成 wbsetclaim

		if (options.bot) {
			POST_data.bot = 1;
		}
		if (options.summary) {
			POST_data.summary = options.summary;
		}
		// TODO: baserevid, 但這需要每次重新取得 revid。

		// the token should be sent as the last parameter.
		POST_data.token = token;

		// 即使已存在相同屬性值，依然添增/處理其 references 設定。
		var force_add_references = options.force_add_references,
		//
		set_next_claim = function() {
			var claims = data.claims;
			library_namespace.debug('claims: ' + JSON.stringify(claims), 3,
					'set_next_claim');
			// console.log(claim_index + '-'.repeat(60));
			// console.log(claims);
			if (claim_index === claims.length) {
				library_namespace.debug('done. 已處理完所有能處理的。 callback();', 2,
						'set_next_claim');
				// 去除空的設定。
				if (library_namespace.is_empty_object(data.claims)) {
					delete data.claims;
				}

				// console.log('' + callback);
				callback();
				return;
			}

			var property_data = claims[claim_index], property_id = property_data.property, exists_property_list = entity
					&& entity.claims && entity.claims[property_id];

			if (property_data.remove === wikidata_edit.remove_all) {
				// assert: 有此屬性id
				// delete: {P1:CeL.wiki.edit_data.remove_all}
				library_namespace.debug(
						'delete ' + property_id + ' one by one', 1,
						'set_next_claim');
				remove_claims(exists_property_list, shift_to_next, POST_data,
						claim_action[0], session, property_data.remove);
				return;
			}

			// ((true >= 0))
			if (typeof property_data.remove === 'number'
					&& property_data.remove >= 0) {
				// delete: {P1:value,remove:true}
				library_namespace.debug('delete ' + property_id + '['
						+ property_data.remove + ']', 1, 'set_next_claim');
				remove_claims(exists_property_list, shift_to_next, POST_data,
						claim_action[0], session, property_data.remove);
				return;
			}

			if (property_data.remove) {
				library_namespace.error('set_next_claim: Invalid .remove ['
						+ property_data.remove + '].');
				shift_to_next();
				return;
			}

			if (property_data.exists_index >= 0) {
				library_namespace.debug('Skip ' + property_id + '['
						+ property_data.exists_index + '] 此屬性已存在相同值 ['
						+ wikidata_datavalue(property_data) + ']'
						+ (force_add_references ? '，但依舊處理其 references 設定' : '')
						+ '。', 1, 'set_next_claim');
				if (force_add_references) {
					if (!property_data.references) {
						throw 'set_next_claim: No references found!';
					}
					var exists_references = entity.claims[property_id][property_data.exists_index].references;
					set_references(
							exists_property_list[property_data.exists_index].id,
							property_data, shift_to_next, POST_data,
							claim_action[0], session,
							// should use .references[*].snaks
							exists_references && exists_references[0].snaks);

				} else {
					// default: 跳過已存在相同屬性值之 references 設定。
					// 因為此時 references 可能為好幾組設定，不容易分割排除重複 references，結果將會造成重複輸入。
					shift_to_next();
				}

				return;
			}

			POST_data.property = property_id;
			// 照datavalue修改 POST_data。
			POST_data.snaktype = property_data.snaktype;
			if (POST_data.snaktype === 'value') {
				POST_data.value = JSON.stringify(property_data.datavalue.value);
			} else {
				// 不直接刪掉 POST_data.value，因為此值為 placeholder 佔位符。
				POST_data.value = '';
			}

			// console.log(JSON.stringify(POST_data));
			// console.log(POST_data);

			wiki_API.query(claim_action, function(data) {
				var error = data && data.error;
				// 檢查伺服器回應是否有錯誤資訊。
				if (error) {
					/**
					 * e.g., <code>
					 * set_next_claim: [invalid-entity-id] Invalid entity ID. (The serialization "読み仮名" is not recognized by the configured id builders)
					 * </code>
					 */
					library_namespace.error('set_next_claim: [' + error.code
							+ '] ' + error.info);
					library_namespace.warn('data to write: '
							+ JSON.stringify(POST_data));
					// console.log(claim_index);
					// console.log(claims);
					claim_index++;
					set_next_claim();

				} else if (property_data.references) {
					// data =
					// {"pageinfo":{"lastrevid":00},"success":1,"claim":{"mainsnak":{"snaktype":"value","property":"P1","datavalue":{"value":{"text":"name","language":"zh"},"type":"monolingualtext"},"datatype":"monolingualtext"},"type":"statement","id":"Q1$1-2-3","rank":"normal"}}

					set_references(data.claim.id, property_data, shift_to_next,
							POST_data, claim_action[0], session);

				} else {
					shift_to_next();
				}

			}, POST_data, session);
			// console.log('set_next_claim: Waiting for ' + claim_action);
		},
		//
		shift_to_next = function() {
			var claims = data.claims;
			library_namespace.debug(claim_index + '/' + claims.length, 3,
					'shift_to_next');
			// 排掉能處理且已經處理完畢的claim。
			if (claim_index === 0) {
				claims.shift();
			} else {
				// assert: claim_index>0
				claims.splice(claim_index, 1);
			}
			set_next_claim();
		};

		normalize_wikidata_properties(data.claims, function(claims) {
			if (!Array.isArray(claims)) {
				if (claims) {
					library_namespace.error('set_claims: Invalid claims: '
							+ JSON.stringify(claims));
				} else {
					// assert: 本次沒有要設定 claim 的資料。
				}
				callback();
				return;
			}

			// e.g., claims:[{P1:'',language:'zh'},{P2:'',references:{}}]
			data.claims = claims;

			// console.log(JSON.stringify(claims));
			// console.log(claims);
			set_next_claim();
		}, entity && entity.claims
		// 確保會設定 .remove / .exists_index = duplicate_index。
		|| Object.create(null),
		//
		Object.assign({
			// [KEY_SESSION]
			session : session
		}));
	}

	if (false) {
		// examples

		// Cache the id of "性質" first. 先快取必要的屬性id值。
		CeL.wiki.data.search.use_cache('性質', function(id_list) {
			// Get the id of property '性質' first.
			// and here we get the id of '性質': "P31"
			CeL.log(id_list);
			// 執行剩下的程序. run rest codes.
		}, {
			must_callback : true,
			type : 'property'
		});

		// ----------------------------
		// rest codes:

		// Set up the wiki instance.
		var wiki = CeL.wiki.login(user_name, password, 'zh');

		wiki.data('維基數據沙盒2', function(data_JSON) {
			CeL.wiki.data.search.use_cache('性質', function(id_list) {
				data_JSON.value('性質', {
					// resolve wikibase-item
					resolve_item : true
				}, function(entity) {
					// get "Wikidata Sandbox"
					CeL.log(entity.value('label', 'en'));
				});
			}, {
				must_callback : true,
				type : 'property'
			});
		});

		// If we have run CeL.wiki.data.search.use_cache('性質')
		// first or inside it...
		wiki.data('維基數據沙盒2', function(data_JSON) {
			data_JSON.value('性質', {
				// resolve wikibase-item
				resolve_item : true
			}, function(entity) {
				// get "Wikidata Sandbox"
				CeL.log(entity.value('label', 'en'));
			});
		});

		// Old style. The same effect as codes above.
		wiki.data('維基數據沙盒2', function(data_JSON) {
			// Here we are running the callback.
			CeL.wiki.data.search.use_cache('性質', function(id_list) {
				wiki.data(data_JSON.value('性質'), function(entity) {
					// via wikidata_entity_value()
					// get "维基数据测试沙盒"
					CeL.log(entity.value('label'));
				});
			}, {
				must_callback : true,
				type : 'property'
			});
		});

		wiki.data('維基數據沙盒2', function(data_JSON) {
			wiki.data(data_JSON.value('性質'), function(entity) {
				// via wikidata_entity_value()
				// get "维基数据测试沙盒"
				CeL.log(entity.value('label'));
			});
		});

		// edit properties
		wiki.edit_data(function(entity) {
			// add new / set single value with references
			return {
				生物俗名 : '維基數據沙盒2',
				language : 'zh-tw',
				references : {
					臺灣物種名錄物種編號 : 123456,
					// [[d:Special:AbuseFilter/54]]
					// 導入自 : 'zhwiki',
					載於 : '臺灣物種名錄物種',
					來源網址 : 'https://www.wikidata.org/',
					檢索日期 : new Date
				}
			};

			// set multiple values
			return {
				labels : {
					ja : 'ウィキデータ・サンドボックス2',
					'zh-tw' : [ '維基數據沙盒2', '維基數據沙盒#2', '維基數據沙盒-2' ]
				},
				descriptions : {
					'zh-tw' : '作為沙盒以供測試功能'
				},
				claims : [ {
					生物俗名 : [ 'SB2#1', 'SB2#2', 'SB2#3' ],
					multi : true,
					language : 'zh-tw',
					references : {
						臺灣物種名錄物種編號 : 123456
					}
				}, {
					読み仮名 : 'かな',
					language : 'ja',
					references : {
						imported_from : 'jawiki'
					}
				} ]
			};

			// remove specified value 生物俗名=SB2
			return {
				生物俗名 : 'SB2',
				language : 'zh-tw',
				remove : true
			};

			// to remove ALL "生物俗名"
			return {
				生物俗名 : CeL.wiki.edit_data.remove_all,
				language : 'zh-tw'
			};

		}, {
			bot : 1,
			summary : 'bot test: edit properties'
		});

		// ----------------------------

		// add property/claim to Q13406268
		wiki.data('維基數據沙盒2', function(data_JSON) {
			data_JSON;
		}).edit_data(function(entity) {
			return {
				生物俗名 : '維基數據沙盒2',
				language : 'zh-tw'
			};
		}, {
			bot : 1,
			summary : 'bot test: edit property'
		});

		// delete property/claim (all 生物俗名)
		wiki.data('維基數據沙盒2', function(data_JSON) {
			data_JSON;
		}).edit_data(function(entity) {
			return {
				生物俗名 : CeL.wiki.edit_data.remove_all,
				language : 'zh-tw'
			};
		}, {
			bot : 1,
			summary : 'bot test: edit property'
		});

		// delete property/claim (生物俗名=維基數據沙盒2)
		wiki.data('維基數據沙盒2', function(data_JSON) {
			data_JSON;
		}).edit_data(function(entity) {
			return {
				生物俗名 : '維基數據沙盒2',
				language : 'zh-tw',
				remove : true
			};
		}, {
			bot : 1,
			summary : 'bot test: edit property'
		});

		wiki.data('維基數據沙盒2', function(data_JSON) {
			data_JSON;
		}).edit_data(function(entity) {
			return {
				生物俗名 : '維基數據沙盒2',
				language : 'zh-tw',
				references : {
					臺灣物種名錄物種編號 : 123456,
					// [[d:Special:AbuseFilter/54]]
					// 導入自 : 'zhwiki',
					載於 : '臺灣物種名錄物種',
					來源網址 : 'https://www.wikidata.org/',
					檢索日期 : new Date
				}
			};
		}, {
			bot : 1,
			summary : 'bot test: edit property'
		});
	}

	// ----------------------------------------------------

	// TODO:
	// data.labels + data.aliases:
	// {language_code:[label,{value:label,language:language_code,remove:''},...],...}
	// or will auto-guess language 未指定語言者將會自動猜測:
	// [label,{value:label,language:language_code,remove:''},{value:label,remove:''}]
	// or
	// [ [language_code,label], [language_code,label], ... ]
	//
	// 正規化 →
	// {language_code:[label_1,label_2,...],...}
	//
	// 去掉重複的標籤 →
	// {language_code:[label_1,label_2,...],...}
	// + .remove: {language_code:[label_1,label_2,...],...}
	//
	// → data.labels = {language_code:{value:label,language:language_code},...}
	// + data.aliases =
	// {language_code:[{value:label,language:language_code}],...}

	// adjust 調整 labels to aliases
	// @see wikidata_edit.add_labels
	function normalize_labels_aliases(data, entity, options) {
		var label_data = data.labels;
		if (typeof label_data === 'string') {
			label_data = [ label_data ];
		}

		if (library_namespace.is_Object(label_data)) {
			// assert: 調整 {Object}data.labels。
			// for
			// {en:[{value:label,language:language_code},{value:label,language:language_code},...]}
			var labels = [];
			for ( var language in label_data) {
				var label = label_data[language];
				if (Array.isArray(label)) {
					label.forEach(function(l) {
						// assert: {Object}l
						labels.push({
							language : language,
							value : l
						});
					});
				} else {
					labels.push(typeof label === 'string' ? {
						language : language,
						value : label
					}
					// assert: {Object}label || [language,label]
					: label);
				}
			}
			label_data = labels;

		} else if (!Array.isArray(label_data)) {
			if (label_data !== undefined) {
				// error?
			}
			return;
		}

		// assert: {Array}label_data = [label,label,...]

		// for
		// [{value:label,language:language_code},{value:label,language:language_code},...]

		// 正規化 →
		// labels = {language_code:[label_1,label_2,...],...}
		var labels = Object.create(null),
		// 先指定的為主labels，其他多的labels放到aliases。
		aliases = data.aliases || Object.create(null),
		// reconstruct labels
		error_list = label_data.filter(function(label) {
			if (!label && label !== '') {
				// Skip null label.
				return;
			}

			if (typeof label === 'string') {
				label = {
					language : wikidata_get_site(options, true)
							|| guess_language(label),
					value : label
				};
			} else if (is_api_and_title(label, 'language')) {
				label = {
					language : label[0] || guess_language(label[1]),
					value : label[1]
				};
			} else if (!label.language
			//
			|| !label.value && !('remove' in label)) {
				library_namespace.error('set_labels: Invalid label: '
						+ JSON.stringify(label));
				return true;
			}

			if (!(label.language in labels) && entity && entity.labels
					&& entity.labels[label.language]) {
				labels[label.language]
				// 不佚失原label。
				= entity.labels[label.language].value;
			}

			if (!labels[label.language] || !labels[label.language].value
			//
			|| ('remove' in labels[label.language])) {
				// 設定成為新的值。
				labels[label.language] = label;
				return;
			}

			// 先指定的為主labels，其他多的labels放到aliases。
			if (aliases[label.language]) {
				// assert: Array.isArray(aliases[label.language])
				aliases[label.language].push(label);
			} else {
				aliases[label.language] = [ label ];
			}
		});

		// 去除空的設定。
		if (library_namespace.is_empty_object(labels)) {
			delete data.labels;
		} else {
			data.labels = labels;
		}

		if (library_namespace.is_empty_object(aliases)) {
			delete data.aliases;
		} else {
			data.aliases = aliases;
		}

		// return error_list;
	}

	/**
	 * edit labels
	 * 
	 * @inner only for wikidata_edit()
	 */
	function set_labels(data, token, callback, options, session, entity) {
		if (!data.labels) {
			// Nothing to set
			callback();
			return;
		}

		normalize_labels_aliases(data, entity, options);

		var data_labels = data.labels;
		// e.g., data.labels={language_code:label,language_code:[labels],...}
		if (!library_namespace.is_Object(data_labels)) {
			library_namespace.error('set_labels: Invalid labels: '
					+ JSON.stringify(data_labels));
			callback();
			return;
		}

		var labels_to_set = [];
		for ( var language in data_labels) {
			var label = data_labels[language];
			if (!library_namespace.is_Object(label)) {
				library_namespace.error('set_labels: Invalid label: '
						+ JSON.stringify(label));
				continue;
			}

			labels_to_set.push(label);
		}

		if (labels_to_set.length === 0) {
			callback();
			return;
		}

		var POST_data = {
			id : options.id,
			language : '',
			value : ''
		};

		if (options.bot) {
			POST_data.bot = 1;
		}
		if (options.summary) {
			POST_data.summary = options.summary;
		}
		// TODO: baserevid, 但這需要每次重新取得 revid。

		// the token should be sent as the last parameter.
		POST_data.token = token;

		var index = 0,
		// https://www.wikidata.org/w/api.php?action=help&modules=wbsetlabel
		action = [ get_data_API_URL(options), 'wbsetlabel' ];

		function set_next_labels() {
			if (index === labels_to_set.length) {
				library_namespace.debug('done. 已處理完所有能處理的。 callback();', 2,
						'set_next_labels');
				// 去除空的設定。
				if (library_namespace.is_empty_object(data.labels)) {
					delete data.labels;
				}

				callback();
				return;
			}

			var label = labels_to_set[index++];
			// assert: 這不會更改POST_data原有keys之順序。
			// Object.assign(POST_data, label);

			POST_data.language = label.language;
			// wbsetlabel 處理 value='' 時會視同 remove。
			POST_data.value = 'remove' in label ? ''
			// assert: typeof label.value === 'string' or 'number'
			: label.value;

			// 設定單一 Wikibase 實體的標籤。
			wiki_API.query(action, function(data) {
				var error = data && data.error;
				// 檢查伺服器回應是否有錯誤資訊。
				if (error) {
					/**
					 * e.g., <code>
					 * 
					 * </code>
					 */
					library_namespace.error('set_next_labels: [' + error.code
							+ '] ' + error.info);
				} else {
					// successful done.
					delete data_labels[label.language];
				}

				set_next_labels();

			}, POST_data, session);
		}

		set_next_labels();

		// TODO: set sitelinks
		// TODO: 可拆解成 wbsetsitelink
	}

	/**
	 * edit aliases
	 * 
	 * @inner only for wikidata_edit()
	 */
	function set_aliases(data, token, callback, options, session, entity) {
		if (!data.aliases) {
			// Nothing to set
			callback();
			return;
		}

		// console.log(data.aliases);

		var data_aliases = data.aliases, aliases_queue;
		if (Array.isArray(data_aliases)) {
			aliases_queue = data_aliases;
			data_aliases = Object.create(null);
			aliases_queue.forEach(function(alias) {
				// 判別 language。
				var value = alias && alias.value, language = alias.language
						|| options.language || guess_language(value);
				if (language in data_aliases) {
					data_aliases[language].push(alias);
				} else {
					data_aliases[language] = [ alias ];
				}
			});

		} else if (!library_namespace.is_Object(data_aliases)) {
			library_namespace.error('set_aliases: Invalid aliases: '
					+ JSON.stringify(data_aliases));
			callback();
			return;
		}

		aliases_queue = [];
		for ( var language in data_aliases) {
			var alias_list = data_aliases[language];
			if (!Array.isArray(alias_list)) {
				if (alias_list === wikidata_edit.remove_all) {
					// 表示 set。
					aliases_queue.push([ language, [] ]);
				} else if (alias_list && typeof alias_list === 'string') {
					// 表示 set。
					aliases_queue.push([ language, [ alias_list ] ]);
				} else {
					library_namespace.error('set_aliases: Invalid aliases: '
							+ JSON.stringify(alias_list));
				}
				continue;
			}

			var aliases_to_add = [], aliases_to_remove = [];
			alias_list.forEach(function(alias) {
				if (!alias) {
					// 跳過沒東西的。
					return;
				}
				if ('remove' in alias) {
					if (alias.remove === wikidata_edit.remove_all) {
						// 表示 set。這將會忽略所有remove。
						aliases_to_remove = undefined;
					} else if ('value' in alias) {
						if (aliases_to_remove) {
							aliases_to_remove.push(alias.value);
						}
					} else {
						library_namespace
								.error('set_aliases: No value to value for '
										+ language);
					}
				} else if ('set' in alias) {
					// 表示 set。這將會忽略所有remove。
					aliases_to_remove = undefined;
					aliases_to_add = [ alias.value ];
					// 警告:當使用 wbeditentity，並列多個未設定 .add 之 alias 時，
					// 只會加入最後一個。但這邊將會全部加入，因此行為不同！
				} else if (alias.value === wikidata_edit.remove_all) {
					// 表示 set。這將會忽略所有remove。
					aliases_to_remove = undefined;
				} else {
					aliases_to_add.push(alias.value);
				}
			});

			if (aliases_to_add.length > 0 || aliases_to_remove > 0) {
				aliases_queue.push([ language, aliases_to_add.unique(),
						aliases_to_remove && aliases_to_remove.unique() ]);
			}
		}

		if (aliases_queue.length === 0) {
			callback();
			return;
		}

		// console.log(aliases_queue);

		var POST_data = {
			id : options.id,
			language : ''
		// set : '',
		// add : '',
		// remove : ''
		};

		if (options.bot) {
			POST_data.bot = 1;
		}
		if (options.summary) {
			POST_data.summary = options.summary;
		}
		// TODO: baserevid, 但這需要每次重新取得 revid。

		var
		// https://www.wikidata.org/w/api.php?action=help&modules=wbsetaliases
		action = [ get_data_API_URL(options), 'wbsetaliases' ];

		function set_next_aliases() {
			if (aliases_queue.length === 0) {
				library_namespace.debug('done. 已處理完所有能處理的。 callback();', 2,
						'set_next_aliases');
				// 有錯誤也已經提醒。
				delete data.aliases;

				callback();
				return;
			}

			var aliases_data = aliases_queue.pop();
			// assert: 這不會更改POST_data原有keys之順序。

			POST_data.language = aliases_data[0];
			if (aliases_data[2]) {
				delete POST_data.set;
				POST_data.add = aliases_data[1].join('|');
				POST_data.remove = aliases_data[2].join('|');
			} else {
				delete POST_data.add;
				delete POST_data.remove;
				POST_data.set = aliases_data[1].join('|');
			}

			// the token should be sent as the last parameter.
			delete POST_data.token;
			POST_data.token = token;

			// 設定單一 Wikibase 實體的標籤。
			wiki_API.query(action, function(data) {
				var error = data && data.error;
				// 檢查伺服器回應是否有錯誤資訊。
				if (error) {
					/**
					 * e.g., <code>
					 * 
					 * </code>
					 */
					library_namespace.error('set_next_aliases: [' + error.code
							+ '] ' + error.info);
				} else {
					// successful done.
				}

				set_next_aliases();

			}, POST_data, session);
		}

		set_next_aliases();
	}

	/**
	 * edit descriptions
	 * 
	 * @inner only for wikidata_edit()
	 */
	function set_descriptions(data, token, callback, options, session, entity) {
		if (!data.descriptions) {
			// Nothing to set
			callback();
			return;
		}

		// console.log(data.descriptions);

		var data_descriptions = data.descriptions;
		if (typeof data_descriptions === 'string') {
			data_descriptions = [ data_descriptions ];
		}

		if (library_namespace.is_Object(data_descriptions)) {
			// assert: 調整 {Object}data.descriptions。
			// for
			// {en:[{value:label,language:language_code},{value:label,language:language_code},...]}
			var descriptions = [];
			for ( var language in data_descriptions) {
				var description = data_descriptions[language];
				if (Array.isArray(description)) {
					description.forEach(function(d) {
						// assert: {Object}d
						descriptions.push({
							language : language,
							value : d
						});
					});
				} else {
					descriptions.push(typeof description === 'string' ? {
						language : language,
						value : description
					}
					// assert: {Object}description || [language,description]
					: description);
				}
			}
			data_descriptions = descriptions;

		} else if (!Array.isArray(data_descriptions)) {
			if (data_descriptions !== undefined) {
				// error?
			}
			return;
		}

		// 正規化 →
		// descriptions = {language_code:description,...}
		var descriptions = Object.create(null),
		//
		d_language = session.language || session[KEY_HOST_SESSION].language
				|| default_language,
		// reconstruct labels
		error_list = data_descriptions.filter(function(description) {
			var language;
			if (typeof description === 'string') {
				language = wikidata_get_site(options, true)
						|| guess_language(description) || d_language;
			} else if (is_api_and_title(description, 'language')) {
				language = description[0] || guess_language(description[1])
						|| d_language;
				description = description[1];
			} else if (!description || !description.language
			//
			|| !description.value && !('remove' in description)) {
				library_namespace
						.error('set_descriptions: Invalid descriptions: '
								+ JSON.stringify(description));
				return true;
			} else {
				language = description.language
						|| wikidata_get_site(options, true)
						|| guess_language(description.value) || d_language;
				if ('remove' in description) {
					description = '';
				} else {
					description = description.value;
				}
			}

			// 設定成為新的值。
			descriptions[language] = description || '';
		});

		// 去除空的設定。
		if (library_namespace.is_empty_object(descriptions)) {
			delete data.descriptions;
			callback();
			return;
		}

		// console.log(descriptions);

		var POST_data = {
			id : options.id,
			language : '',
			value : ''
		};

		if (options.bot) {
			POST_data.bot = 1;
		}
		if (options.summary) {
			POST_data.summary = options.summary;
		}
		// TODO: baserevid, 但這需要每次重新取得 revid。

		// the token should be sent as the last parameter.
		POST_data.token = token;

		var description_keys = Object.keys(descriptions),
		// https://www.wikidata.org/w/api.php?action=help&modules=wbsetdescription
		action = [ get_data_API_URL(options), 'wbsetdescription' ];

		function set_next_descriptions() {
			if (description_keys.length === 0) {
				library_namespace.debug('done. 已處理完所有能處理的。 callback();', 2,
						'set_next_descriptions');
				// 有錯誤也已經提醒。
				delete data.descriptions;

				callback();
				return;
			}

			var language = description_keys.pop();
			// assert: 這不會更改POST_data原有keys之順序。

			POST_data.language = language;
			POST_data.value = descriptions[language];

			// 設定單一 Wikibase 實體的標籤。
			wiki_API.query(action, function(data) {
				var error = data && data.error;
				// 檢查伺服器回應是否有錯誤資訊。
				if (error) {
					/**
					 * e.g., <code>
					 * 
					 * </code>
					 */
					library_namespace.error('set_next_descriptions: ['
							+ error.code + '] ' + error.info);
				} else {
					// successful done.
				}

				set_next_descriptions();

			}, POST_data, session);
		}

		set_next_descriptions();
	}

	// ----------------------------------------------------

	/**
	 * Creates or modifies Wikibase entity. 創建或編輯Wikidata實體。
	 * 
	 * 注意: 若是本來已有某個值（例如 label），採用 add 會被取代。或須偵測並避免更動原有值。
	 * 
	 * @example<code>

	 wiki = Wiki(true, 'test.wikidata');
	 // TODO:
	 wiki.page('宇宙').data(function(entity){result=entity;console.log(entity);}).edit(function(){return '';}).edit_data(function(){return {};});
	 wiki.page('宇宙').edit_data(function(entity){result=entity;console.log(entity);});

	 </code>
	 * 
	 * @param {String|Array}id
	 *            id to modify or entity you want to create.<br />
	 *            item/property 將會創建實體。
	 * @param {Object|Function}data
	 *            used as the data source to modify. 要編輯（更改或創建）的資料。可能被更改！<br />
	 *            {Object}data or {Function}data(entity)
	 * @param {Object}token
	 *            login 資訊，包含“csrf”令牌/密鑰。
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * @param {Function}callback
	 *            回調函數。 callback(entity, error)
	 * 
	 * @see https://www.wikidata.org/wiki/Wikidata:Creating_a_bot
	 * @see https://www.wikidata.org/wiki/Wikidata:Bots<br />
	 *      Monitor
	 *      https://www.wikidata.org/wiki/Wikidata:Database_reports/Constraint_violations<br />
	 *      Bots should add instance of (P31 性質) or subclass of (P279 上一級分類) or
	 *      part of (P361 屬於) if possible<br />
	 *      Bots importing from Wikipedia should add in addition to imported
	 *      from (P143) also reference URL (P854) with the value of the full URL
	 *      and either retrieved (P813) or include the version id of the source
	 *      page in the full URL.
	 */
	function wikidata_edit(id, data, token, options, callback) {
		if (typeof options === 'function' && !callback) {
			// shift arguments.
			callback = options;
			options = null;
		}

		if (!library_namespace.is_Object(options)) {
			// 前置處理。
			options = Object.create(null);
		}

		if (!id && !options['new']) {
			callback(undefined, {
				code : 'no_id',
				message : 'Did not set id! 未設定欲取得之特定實體id。'
			});
			return;
		}

		if (typeof data === 'function') {
			if (is_entity(id)) {
				library_namespace.debug('餵給(回傳要編輯資料的)設定值函數 ' + id.id + ' ('
						+ (get_entity_label(id) || get_entity_link(id)) + ')。',
						2, 'wikidata_edit');
				// .call(options,): 使(回傳要編輯資料的)設定值函數能以this即時變更 options。
				data = data.call(options, id);

			} else {
				if (false) {
					library_namespace.debug(
					// TypeError: Converting circular structure to JSON
					'Get id from ' + JSON.stringify(id), 3, 'wikidata_edit');
				}
				wikidata_entity(id, options.props, function(entity, error) {
					if (error) {
						library_namespace.debug('Get error '
								+ JSON.stringify(error), 3, 'wikidata_edit');
						callback(undefined, error);
						return;
					}
					if (false) {
						// TypeError: Converting circular structure to JSON
						library_namespace.debug('Get entity '
								+ JSON.stringify(entity), 3, 'wikidata_edit');
					}
					if (!entity || ('missing' in entity)) {
						// TODO: e.g., 此頁面不存在/已刪除。
						// return;
					}

					delete options.props;
					delete options.languages;
					// .call(options,): 使(回傳要編輯資料的)設定值函數能以this即時變更 options。
					data = data.call(options, is_entity(entity) ? entity
					// error?
					: undefined);
					wikidata_edit(id, data, token, options, callback);
				}, options);
				return;
			}
		}

		var entity;
		if (is_entity(id)) {
			// 輸入 id 為實體項目 entity
			entity = id;
			if (!options.baserevid) {
				// 檢測編輯衝突用。
				options.baserevid = id.lastrevid;
			}
			id = id.id;
		}

		var action = wiki_API.edit.check_data(data, id, options,
				'wikidata_edit');
		if (action) {
			library_namespace.debug('直接執行 callback。', 2, 'wikidata_edit');
			callback(undefined, action);
			return;
		}

		if (!id) {
			if (!options['new'])
				library_namespace
						.debug('未設定 id，您可能需要手動檢查。', 2, 'wikidata_edit');

		} else if (is_entity(id)
		// && /^Q\d{1,10}$/.test(id.id)
		) {
			options.id = id.id;

		} else if (get_page_content.is_page_data(id)) {
			options.site = wikidata_get_site(options);
			options.title = encodeURIComponent(id.title);

		} else if (id === 'item' || id === 'property') {
			options['new'] = id;

		} else if (/^Q\d{1,10}$/.test(id)) {
			// e.g., 'Q1'
			options.id = id;

		} else if (is_api_and_title(id)) {
			options.site = language_to_site_name(id[0]);
			options.title = id[1];

		} else {
			library_namespace.warn('wikidata_edit: Invalid id: ' + id);
		}

		var session;
		if ('session' in options) {
			session = options[KEY_SESSION];
			delete options[KEY_SESSION];
		}

		// edit實體項目entity
		action = [
		// https://www.wikidata.org/w/api.php?action=help&modules=wbeditentity
		get_data_API_URL(options), 'wbeditentity' ];

		// 還存在此項可能會被匯入 query 中。但須注意刪掉後未來將不能再被利用！
		delete options.API_URL;

		if (library_namespace.is_Object(token)) {
			token = token.csrftoken;
		}

		function do_wbeditentity() {
			for ( var key in data) {
				if (Array.isArray(data[key]) ? data[key].length === 0
						: library_namespace.is_empty_object(data[key])) {
					delete data[key];
				}
			}
			if (library_namespace.is_empty_object(data)) {
				callback(data);
				return;
			}
			// data 會在 set_claims() 被修改，因此不能提前設定。
			options.data = JSON.stringify(data);
			if (library_namespace.is_debug(2)) {
				library_namespace.debug('options.data: ' + options.data, 2,
						'wikidata_edit.do_wbeditentity');
				console.log(data);
			}

			// the token should be sent as the last parameter.
			options.token = token;

			wiki_API.query(action, function handle_result(data) {
				var error = data && data.error;
				// 檢查伺服器回應是否有錯誤資訊。
				if (error) {
					library_namespace.error(
					// e.g., 數據庫被禁止寫入以進行維護，所以您目前將無法保存您所作的編輯
					// Mediawiki is in read-only mode during maintenance
					'wikidata_edit.do_wbeditentity: '
					//
					+ (options.id ? options.id + ': ' : '')
					// [readonly] The wiki is currently in read-only mode
					+ '[' + error.code + '] ' + error.info);
					library_namespace.warn('data to write: '
							+ JSON.stringify(options));
					callback(undefined, error);
					return;
				}

				if (data.entity) {
					data = data.entity;
				}
				callback(data);
			}, options, session);
		}

		if (false && Array.isArray(data)) {
			// TODO: 按照內容分類。
			library_namespace
					.warn('wikidata_edit.do_wbeditentity: Treat {Array}data as {claims:data}!');
			data = {
				claims : data
			};
		}

		// TODO: 創建實體項目重定向。
		// https://www.wikidata.org/w/api.php?action=help&modules=wbcreateredirect

		// TODO: 避免 callback hell: using ES7 async/await?
		// TODO: 用更簡單的方法統合這幾個函數。
		set_claims(data, token, function() {
			set_labels(data, token, function() {
				set_aliases(data, token, function() {
					set_descriptions(data, token, do_wbeditentity, options,
							session, entity);
				}, options, session, entity);
			}, options, session, entity);
		}, options, session, entity);
	}

	// CeL.wiki.edit_data.somevalue
	// snaktype somevalue 未知數值 unknown value
	wikidata_edit.somevalue = {
		// 單純表達意思用的內容結構，可以其他的值代替。
		unknown_value : true
	};

	// CeL.wiki.edit_data.remove_all
	// 注意: 不可為 index!
	wikidata_edit.remove_all = {
		// 單純表達意思用的內容結構，可以其他的值代替。
		remove_all : true
	};

	/**
	 * 取得指定實體，指定語言的所有 labels 與 aliases 值之列表。
	 * 
	 * @param {Object}entity
	 *            指定實體的 JSON 值。
	 * @param {String}[language]
	 *            指定取得此語言之資料。
	 * @param {Array}[list]
	 *            添加此原有之 label 列表。<br />
	 *            list = [ {String}label, ... ]
	 * 
	 * @returns {Array}所有 labels 與 aliases 值之列表。
	 */
	function entity_labels_and_aliases(entity, language, list) {
		if (!Array.isArray(list))
			// 初始化。
			list = [];

		if (!entity)
			return list;

		if (false && language && is_entity(entity) && !list) {
			// faster

			/** {Object|Array}label */
			var label = entity.labels[language],
			/** {Array}aliases */
			list = entity.aliases && entity.aliases[language];

			if (label) {
				label = label.value;
				if (list)
					// 不更動到原 aliases。
					(list = list.map(function(item) {
						return item.value;
					})).unshift(label);
				else
					list = [ label ];
			} else if (!list) {
				return [];
			}

			return list;
		}

		function add_list(item_list) {
			if (Array.isArray(item_list)) {
				// assert: {Array}item_list 為 wikidata_edit() 要編輯（更改或創建）的資料。
				// assert: item_list = [{language:'',value:''}, ...]
				list.append(item_list.map(function(item) {
					return item.value;
				}));

			} else if (!language) {
				// assert: {Object}item_list
				for ( var _language in item_list) {
					// assert: Array.isArray(aliases[label])
					add_list(item_list[_language]);
				}

			} else if (language in item_list) {
				// assert: {Object}item_list
				item_list = item_list[language];
				if (Array.isArray(item_list))
					add_list(item_list);
				else
					list.push(item_list.value);
			}
		}

		entity.labels && add_list(entity.labels);
		entity.aliases && add_list(entity.aliases);
		return list;
	}

	// common characters.
	// FULLWIDTH full width form characters 全形 ØωⅡ
	var PATTERN_common_characters_FW = /[\s\-ー・·．˙•，、。？！；：“”‘’「」『』（）－—…《》〈〉【】〖〗〔〕～←→↔⇐⇒⇔]+/g,
	// [[:en:Chùa Báo Quốc]]
	// {{tsl|ja|オメガクインテット|*ω*Quintet}}
	// {{tsl|en|Tamara de Lempicka|Tamara Łempicka}}
	// {{link-en|Željko Ivanek|Zeljko Ivanek}}
	/** {RegExp}常用字母的匹配模式。應該是英語也能接受的符號。 */
	PATTERN_common_characters = /[\s\d_,.:;'"!()\-+\&<>\\\/\?–`@#$%^&*=~×☆★♪♫♬♩○●©®℗™℠]+/g,
	// 不能用來判別語言、不能表達意義的泛用符號/字元。無關緊要（不造成主要意義）的字元。
	PATTERN_only_common_characters = new RegExp('^['
			+ PATTERN_common_characters.source.slice(1, -2)
			//
			+ PATTERN_common_characters_FW.source.slice(1, -2) + ']*$'),
	// non-Chinese / non-CJK: 必須置於所有非中日韓語言之後測試!!
	// 2E80-2EFF 中日韓漢字部首補充 CJK Radicals Supplement
	/** {RegExp}非漢文化字母的匹配模式。 */
	PATTERN_non_CJK = /^[\u0008-\u2E7F]+$/i,
	/**
	 * 判定 label 標籤標題語言使用之 pattern。
	 * 
	 * @type {Object}
	 * 
	 * @see [[以人口排列的語言列表]], [[維基百科:維基百科語言列表]], [[Special:統計#其他語言的維基百科]],
	 *      application.locale.encoding
	 */
	label_language_patterns = {
		// 常用的[[英文字母]]需要放置於第一個測試。
		en : /^[a-z]+$/i,

		// [[西班牙語字母]]
		// 'áéíñóúü'.toLowerCase().split('').sort().unique_sorted().join('')
		es : /^[a-záéíñóúü]+$/i,
		// [[:en:French orthography]]
		// http://character-code.com/french-html-codes.php
		fr : /^[a-z«»àâæçèéêëîïôùûüÿœ₣€]+$/i,
		// [[德語字母]], [[:de:Deutsches Alphabet]]
		de : /^[a-zäöüß]+$/i,

		// [[Arabic script in Unicode]] [[阿拉伯字母]]
		// \u10E60-\u10E7F
		ar : /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+$/,

		// 印度 [[印地語]][[天城文]]
		bh : /^[\u0900-\u097F\uA8E0-\uA8FF\u1CD0-\u1CFF]+$/,
		// [[:en:Bengali (Unicode block)]]
		bn : /^[\u0980-\u09FF]+$/,

		// [[俄語字母]], [\p{IsCyrillic}]+
		ru : /^[\u0401-\u0451]+$/,

		// [[Unicode and HTML for the Hebrew alphabet]] [[希伯來字母]]
		// [[Hebrew (Unicode block)]]
		he : /^[\u0591-\u05F4]+$/,

		// [[越南文字母]]
		vi : /^[aăâbcdđeêghiklmnoôơpqrstuưvxy]+$/i

	}, label_CJK_patterns = {
		ja : /^[\u3041-\u30FF\u31F0-\u31FF\uFA30-\uFA6A]+$/,
		// [[朝鮮字母]]
		ko : /^[\uAC00-\uD7A3\u1100-\u11FF\u3131-\u318E]+$/
	};

	/**
	 * 猜測 label 標籤標題之語言。
	 * 
	 * @param {String}label
	 *            標籤標題
	 * @param {String}[CJK_language]
	 *            預設之中日韓語言 code。
	 * 
	 * @returns {String|Undefined}label 之語言。
	 */
	function guess_language(label, CJK_language) {
		if (!label
		// 先去掉所有泛用符號/字元。
		|| !(label = label.replace(PATTERN_common_characters, ''))) {
			// 刪掉泛用符號/字元後已無東西剩下。
			return;
		}

		// non_CJK: 此處事實上為非中日韓漢字之未知語言。
		var non_CJK = PATTERN_non_CJK.test(label),
		//
		patterns = non_CJK ? label_language_patterns : label_CJK_patterns;

		for ( var language in patterns) {
			if (patterns[language].test(label)) {
				return language;
			}
		}

		if (!non_CJK) {
			return CJK_language;
		}

		library_namespace.warn(
		//
		'guess_language: Unknown non-CJK label: [' + label + ']');
		return '';
	}

	/**
	 * 回傳 wikidata_edit() 可用的個別 label 或 alias 設定項。
	 * 
	 * @param {String}label
	 *            label 值。
	 * @param {String}[language]
	 *            設定此 label 之語言。
	 * @param {String}[default_lang]
	 *            default language to use
	 * @param {Array}[add_to_list]
	 *            添加在此編輯資料列表中。
	 * 
	 * @returns {Object}個別 label 或 alias 設定項。
	 */
	wikidata_edit.add_item = function(label, language, default_lang,
			add_to_list) {
		if (!language || typeof language !== 'string') {
			// 無法猜出則使用預設之語言。
			language = guess_language(label) || default_lang;
			if (!language) {
				return;
			}
		}
		label = {
			language : language,
			value : label,
			add : 1
		};
		if (add_to_list) {
			add_to_list.push(label);
		}
		return label;
	};

	// --------------------------------

	// 測試是否包含前，正規化 label。
	// 注意: 因為會變更 label，不可將此輸出作為最後 import 之內容！
	function key_of_label(label) {
		return label && String(label)
		// 去掉無關緊要（不造成主要意義）的字元。 ja:"・", "ー"
		.replace(PATTERN_common_characters_FW, '').toLowerCase()
		// 去掉複數。 TODO: 此法過於簡略。
		.replace(/s$/, '')
		// 保證回傳 {String}。 TODO: {Number}0
		|| '';
	}

	// 測試是否包含等價或延伸（而不僅僅是完全相同的） label。
	// 複雜版 original.includes(label_to_test)
	// TODO: 可省略 /[,;.!]/
	function include_label(original, label_to_test) {
		// 沒東西要測試，表示也毋須作進一步處理。
		if (!label_to_test) {
			return true;
		}
		// 原先沒東西，表示一定沒包含。
		if (!original) {
			return false;
		}

		label_to_test = key_of_label(label_to_test);

		if (Array.isArray(original)) {
			return original.some(function(label) {
				return key_of_label(label).includes(label_to_test);
			});
		}

		// 測試正規化後是否包含。
		return key_of_label(original).includes(label_to_test);
	}

	/**
	 * 當想把 labels 加入 entity 時，輸入之則可自動去除重複的 labels，並回傳 wikidata_edit() 可用的編輯資料。
	 * merge labels / alias
	 * 
	 * TODO: 不區分大小寫與空格（這有時可能為 typo），只要存在即跳過。或最起碼忽略首字大小寫差異。
	 * 
	 * @param {Object}labels
	 *            labels = {language:[label list],...}
	 * @param {Object}[entity]
	 *            指定實體的 JSON 值。
	 * @param {Object}[data]
	 *            添加在此編輯資料中。
	 * 
	 * @returns {Object}wikidata_edit() 可用的編輯資料。
	 */
	wikidata_edit.add_labels = function(labels, entity, data) {
		var data_alias;

		// assert: {Object}data 為 wikidata_edit() 要編輯（更改或創建）的資料。
		// data={labels:[{language:'',value:'',add:},...],aliases:[{language:'',value:'',add:},...]}
		if (data && (Array.isArray(data.labels) || Array.isArray(data.aliases))) {
			// {Array}data_alias
			data_alias = entity_labels_and_aliases(data);
			if (false) {
				if (!Array.isArray(data.labels))
					data.labels = [];
				else if (!Array.isArray(data.aliases))
					data.aliases = [];
			}

		} else {
			// 初始化。
			// Object.create(null);
			data = {
			// labels : [],
			// aliases : []
			};
		}

		var count = 0;
		// excludes existing label or alias. 去除已存在的 label/alias。
		for ( var language in labels) {
			// 此語言要添加的 label data。
			var label_data = labels[language];
			if (language === 'no') {
				library_namespace.debug('change language [' + language
						+ '] → [nb]', 2, 'wikidata_edit.add_labels');
				// using the language code "nb", not "no", at no.wikipedia.org
				// @see [[phab:T102533]]
				language = 'nb';
			}
			if (!Array.isArray(label_data)) {
				if (label_data)
					;
				library_namespace.warn('wikidata_edit.add_labels: language ['
						+ language + '] is not Array: (' + (typeof label_data)
						+ ')' + label_data);
				continue;
			}

			// TODO: 提高效率。
			var alias = entity_labels_and_aliases(entity, language, data_alias),
			/** {Boolean}此語言是否有此label */
			has_this_language_label = undefined,
			/** {Array}本次 label_data 已添加之 label list */
			new_alias = undefined,
			//
			matched = language.match(/^([a-z]{2,3})-/);

			if (matched) {
				// 若是要添加 'zh-tw'，則應該順便檢查 'zh'。
				entity_labels_and_aliases(entity, matched[1], alias);
			}

			label_data
			// 確保 "title" 在 "title (type)" 之前。
			.sort()
			// 避免要添加的 label_data 本身即有重複。
			.unique_sorted()
			// 處理各 label。
			.forEach(function(label) {
				if (!label || typeof label !== 'string') {
					// warnning: Invalid label.
					return;
				}

				var label_without_type = /\([^()]+\)$/.test(label)
				// e.g., label === "title (type)"
				// → label_without_type = "title"
				&& label.replace(/\s*\([^()]+\)$/, '');

				// 測試是否包含等價或延伸（而不僅僅是完全相同的） label。
				// TODO: 每個 label 每次測試皆得重新 key_of_label()，效率過差。
				if (include_label(alias, label)
				//
				|| label_without_type
				// 當已有 "title" 時，不添加 "title (type)"。
				&& (include_label(alias, label_without_type)
				// assert: !new_alias.includes(label)，已被 .unique() 除去。
				|| new_alias && include_label(new_alias, label_without_type))) {
					// Skip. 已有此 label 或等價之 label。
					return;
				}

				count++;
				if (new_alias)
					new_alias.push(label);
				else
					new_alias = [ label ];

				var item = wikidata_edit.add_item(label, language);

				if (has_this_language_label === undefined)
					has_this_language_label
					// 注意: 若是本來已有某個值（例如 label），採用 add 會被取代。或須偵測並避免更動原有值。
					= entity.labels && entity.labels[language]
					//
					|| data.labels && data.labels.some(function(item) {
						return item.language === language;
					});

				if (!has_this_language_label) {
					// 因為預料會增加的 label/aliases 很少，因此採後初始化。
					if (!data.labels)
						data.labels = [];
					// 第一個當作 label。直接登錄。
					data.labels.push(item);
				} else {
					// 因為預料會增加的 label/aliases 很少，因此採後初始化。
					if (!data.aliases)
						data.aliases = [];
					// 其他的當作 alias
					data.aliases.push(item);
				}
			});

			if (new_alias) {
				if (data_alias)
					data_alias.append(new_alias);
				else
					data_alias = new_alias;
			}
		}

		if (count === 0) {
			// No labels/aliases to set. 已無剩下需要設定之新 label/aliases。
			return;
		}

		if (false) {
			// 已採後初始化。既然造出實例，表示必定有資料。
			// trim 修剪；修整
			if (data.labels.length === 0)
				delete data.labels;
			if (data.aliases.length === 0)
				delete data.aliases;
		}

		return data;
	};

	// ------------------------------------------------------------------------

	/**
	 * 合併自 wikidata 的 entity。
	 * 
	 * TODO: wikidata_merge([to, from1, from2], ...)
	 * 
	 * @param {String}to
	 *            要合併自的ID
	 * @param {String}from
	 *            要合併到的ID
	 * @param {Object}token
	 *            login 資訊，包含“csrf”令牌/密鑰。
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * @param {Function}[callback]
	 *            回調函數。 callback(轉成JavaScript的值. e.g., {Array}list)
	 */
	function wikidata_merge(to, from, token, options, callback) {
		if (!/^Q\d{1,10}$/.test(to)) {
			wikidata_entity(to, function(entity) {
				wikidata_merge(entity.id, from, callback, options);
			});
			return;
		}

		if (!/^Q\d{1,10}$/.test(from)) {
			wikidata_entity(from, function(entity) {
				wikidata_merge(to, entity.id, callback, options);
			});
			return;
		}

		// 正規化並提供可隨意改變的同內容參數，以避免修改或覆蓋附加參數。
		options = library_namespace.new_options(options);

		// 要忽略衝突的項的元素數組，只能包含值“description”和/或“sitelink”和/或“statement”。
		// 多值 (以 | 分隔)：description、sitelink、statement
		// 網站鏈接和描述
		var ignoreconflicts = 'ignoreconflicts' in options ? options.ignoreconflicts
				// 最常使用的功能是合併2頁面。可忽略任何衝突的 description, statement。
				// https://www.wikidata.org/wiki/Help:Statements
				: 'description';

		var session;
		if ('session' in options) {
			session = options[KEY_SESSION];
			delete options[KEY_SESSION];
		}

		var action = 'wbmergeitems&fromid=' + from + '&toid=' + to;
		if (ignoreconflicts) {
			action += '&ignoreconflicts=' + ignoreconflicts;
		}

		action = [
		// 合併重複項。
		// https://www.wikidata.org/w/api.php?action=help&modules=wbmergeitems
		get_data_API_URL(options), action ];

		// the token should be sent as the last parameter.
		options.token = library_namespace.is_Object(token) ? token.csrftoken
				: token;

		wiki_API.query(action, function(data) {
			var error = data && data.error;
			// 檢查伺服器回應是否有錯誤資訊。
			if (error) {
				library_namespace.error('wikidata_merge: ['
				// [failed-modify] Attempted modification of the item failed.
				// (Conflicting descriptions for language zh)
				+ error.code + '] ' + error.info);
				callback(undefined, error);
				return;
			}

			// Will create redirection.
			// 此 wbmergeitems 之回傳 data 不包含 item 資訊。
			// data =
			// {"success":1,"redirected":1,"from":{"id":"Q1","type":"item","lastrevid":1},"to":{"id":"Q2","type":"item","lastrevid":2}}
			// {"success":1,"redirected":0,"from":{"id":"Q1","type":"item","lastrevid":1},"to":{"id":"Q2","type":"item","lastrevid":2}}
			callback(data);
		}, options, session);
	}

	// ------------------------------------------------------------------------

	/** {String}API URL of Wikidata Query. */
	var wikidata_query_API_URL = 'https://wdq.wmflabs.org/api';

	/**
	 * 查詢 Wikidata Query。
	 * 
	 * @example<code>

	 CeL.wiki.wdq('claim[31:146]', function(list) {result=list;console.log(list);});
	 CeL.wiki.wdq('CLAIM[31:14827288] AND CLAIM[31:593744]', function(list) {result=list;console.log(list);});
	 //	查詢國家
	 CeL.wiki.wdq('claim[31:6256]', function(list) {result=list;console.log(list);});


	 // Wikidata filter claim
	 // https://wdq.wmflabs.org/api_documentation.html
	 // https://wdq.wmflabs.org/wdq/?q=claim[31:146]&callback=eer
	 // https://wdq.wmflabs.org/api?q=claim[31:146]&callback=eer
	 CeL.get_URL('https://wdq.wmflabs.org/api?q=claim[31:146]', function(data) {result=data=JSON.parse(data.responseText);console.log(data.items);})
	 CeL.get_URL('https://wdq.wmflabs.org/api?q=string[label:宇宙]', function(data) {result=data=JSON.parse(data.responseText);console.log(data.items);})

	 </code>
	 * 
	 * @param {String}query
	 *            查詢語句。
	 * @param {Function}[callback]
	 *            回調函數。 callback(轉成JavaScript的值. e.g., {Array}list, error)
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 */
	function wikidata_query(query, callback, options) {
		var action = [ options && options.API_URL || wikidata_query_API_URL,
				'?q=', encodeURIComponent(query) ];

		if (options) {
			if (typeof options === 'string') {
				options = {
					props : options
				};
			} else if (Array.isArray(options)) {
				options = {
					props : options.join(',')
				};
			} else {
				// 已使用過。
				delete options.API_URL;
			}

			if (options.wdq_props)
				action.push('&props=', options.wdq_props);
			if (options.noitems)
				// 毋須 '&noitems=1'
				action.push('&noitems');
			// &callback=
		}

		get_URL(action.join(''), function(data) {
			var items;
			// error handling
			try {
				items = JSON.parse(data.responseText).items;
			} catch (e) {
			}
			if (!items || options && options.get_id) {
				callback(undefined, data && data.status || 'Failed to get '
						+ query);
				return;
			}
			if (items.length > 50) {
				// 上限值為 50 (機器人為 500)。
				library_namespace.debug('Get ' + items.length
						+ ' items, more than 50.', 2, 'wikidata_query');
				var session = options && options[KEY_SESSION];
				// session && session.data(items, callback, options);
				if (session && !session.data_session) {
					// 得先登入。
					session.set_data(function() {
						wikidata_entity(items, callback, options);
					});
					return;
				}
			}
			wikidata_entity(items, callback, options);
		});
	}

	/** {String}API URL of Wikidata Query Service (SPARQL). */
	var wikidata_SPARQL_API_URL = 'https://query.wikidata.org/bigdata/namespace/wdq/sparql';

	/**
	 * 查詢 Wikidata Query Service (SPARQL)。
	 * 
	 * @example<code>

	 CeL.wiki.SPARQL('SELECT ?item ?itemLabel WHERE { ?item wdt:P31 wd:Q146 . SERVICE wikibase:label { bd:serviceParam wikibase:language "en" } }', function(list) {result=list;console.log(list);})

	 </code>
	 * 
	 * @param {String}query
	 *            查詢語句。
	 * @param {Function}[callback]
	 *            回調函數。 callback(轉成JavaScript的值. e.g., {Array}list)
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 * 
	 * @see https://www.mediawiki.org/wiki/Wikidata_query_service/User_Manual
	 *      https://www.wikidata.org/wiki/Wikidata:Data_access#SPARQL_endpoints
	 */
	function wikidata_SPARQL(query, callback, options) {
		var action = [ options && options.API_URL || wikidata_SPARQL_API_URL,
				'?query=', encodeURIComponent(query), '&format=json' ];

		get_URL(action.join(''), function(data, error) {
			if (error) {
				callback(undefined, error);
				return;
			}
			data = JSON.parse(data.responseText);
			var items = data.results;
			if (!items || !Array.isArray(items = items.bindings)) {
				callback(data);
				return;
			}
			// 正常情況
			callback(items);
		});
	}

	// --------------------------------------------------------------------------------------------

	/** {String}API URL of PetScan. */
	var wikidata_PetScan_API_URL = 'https://petscan.wmflabs.org/',
	// 常用 parameters。
	PetScan_parameters = 'combination,sparql'.split(',');

	/**
	 * PetScan can generate lists of Wikipedia (and related projects) pages or
	 * Wikidata items that match certain criteria, such as all pages in a
	 * certain category, or all items with a certain property.
	 * 
	 * @example<code>

	// [[:Category:日本のポップ歌手]]直下の記事のうちWikidataにおいて性別(P21)が女性(Q6581072)となっているもの
	CeL.wiki.petscan('日本のポップ歌手',function(items){result=items;console.log(items);},{language:'ja',sparql:'SELECT ?item WHERE { ?item wdt:P21 wd:Q6581072 }'})

	 </code>
	 * 
	 * @param {String}categories
	 *            List of categories, one per line without "category:" part.
	 * @param {Function}[callback]
	 *            回調函數。 callback({Array}[{Object}item])
	 * @param {Object}[options]
	 *            附加參數/設定選擇性/特殊功能與選項
	 */
	function petscan(categories, callback, options) {
		var _options;
		if (options) {
			if (typeof options === 'string') {
				options = {
					language : options
				};
			} else {
				_options = options;
			}
		} else {
			options = Object.create(null);
		}

		var language = options.language || default_language, parameters;
		if (is_api_and_title(categories, 'language')) {
			language = categories[0];
			categories = categories[1];
		}

		if (_options) {
			parameters = Object.create(null);
			PetScan_parameters.forEach(function(parameter) {
				if (parameter in options) {
					parameters[parameter] = options[parameter];
				}
			});
			Object.assign(parameters, options.parameters);
		}
		_options = {
			language : language,
			wikidata_label_language : language,
			categories : Array.isArray(categories)
			// List of categories, one per line without "category:" part.
			// 此時應設定 combination:union/subset
			? categories.join('\n') : categories,
			project : options.project || options.family || 'wikipedia',
			// 確保輸出為需要的格式。
			format : 'wiki',
			doit : 'D'
		};
		if (parameters) {
			Object.assign(parameters, _options);
		} else {
			parameters = _options;
		}

		get_URL((options.API_URL || wikidata_PetScan_API_URL) + '?'
				+ get_URL.parameters_to_String(parameters), function(data,
				error) {
			if (error) {
				callback(undefined, error);
				return;
			}
			data = data.responseText;
			var items = [], matched,
			/**
			 * <code>
			!Title !! Page ID !! Namespace !! Size (bytes) !! Last change !! Wikidata
			| [[Q234598|宇多田ヒカル]] || 228187 || 0 || 49939 || 20161028033707
			→ format form PetScan format=json
			{"id":228187,"len":49939,"namespace":0,"title":"Q234598","touched":"20161028033707"},
			 </code>
			 */
			PATTERN =
			// [ all, title, sitelink, miscellaneous ]
			// TODO: use PATTERN_wikilink
			/\n\|\s*\[\[([^\[\]\|{}\n�]+)\|([^\[\]\n]*?)\]\]\s*\|\|([^\n]+)/g;
			while (matched = PATTERN.exec(data)) {
				var miscellaneous = matched[3].split(/\s*\|\|\s*/),
				//
				item = {
					id : +miscellaneous[0],
					len : +miscellaneous[2],
					namespace : +miscellaneous[1],
					title : matched[1],
					touched : miscellaneous[3]
				};
				if (matched[2]) {
					// Maybe it's label...
					item.sitelink = matched[2];
				}
				if ((matched = miscellaneous[4])
				//
				&& (matched = matched.match(/\[\[:d:([^\[\]\|{}\n#�:]+)/))) {
					item.wikidata = matched[1];
				}
				items.push(item);
			}
			callback(items);
		});
	}

	// --------------------------------------------------------------------------------------------

	var user_language;
	if (typeof mediaWiki === "object" && typeof mw === "object"
			&& mediaWiki === mw) {
		// mw.config
		user_language = mediaWiki.config.get('wgPreferredVariant')
		// || mediaWiki.config.get('wgUserVariant')
		// || mediaWiki.config.get('wgUserLanguage')
		// || mediaWiki.config.get('wgPageContentLanguage')
		;
	}

	// --------------------------------------------------------------------------------------------

	// export 導出.
	Object.assign(wiki_API, {
		api_URL : api_URL,
		set_language : set_default_language,
		// site_name_of
		site_name : language_to_site_name,
		LTR_SCRIPTS : LTR_SCRIPTS,
		PATTERN_LTR : PATTERN_LTR,
		PATTERN_common_characters : PATTERN_common_characters,
		PATTERN_only_common_characters : PATTERN_only_common_characters,
		PATTERN_BOT_NAME : PATTERN_BOT_NAME,
		PATTERN_category : PATTERN_category,

		namespace : get_namespace,
		remove_namespace : remove_namespace,
		is_talk_namespace : is_talk_namespace,

		switch_token : switch_token,

		file_pattern : file_pattern,
		lead_text : lead_text,
		extract_introduction : extract_introduction,
		// sections : get_sections,

		plain_text : wikitext_to_plain_text,

		template_text : to_template_wikitext,

		escape_text : escape_text,

		parse : parse_wikitext,
		parser : page_parser,
		// {Object} file option hash
		file_options : file_options,
		HTML_to_wikitext : HTML_to_wikitext,
		DEFINITION_LIST : DEFINITION_LIST,

		/** constant 中途跳出作業用。 */
		quit_operation : {
			// 單純表達意思用的內容結構，可以其他的值代替。
			quit : true
		},

		is_wiki_API : is_wiki_API,
		is_page_data : get_page_content.is_page_data,
		is_entity : is_entity,

		title_of : get_page_title,
		// CeL.wiki.title_link_of() 常用於 summary 或 log/debug message。
		title_link_of : get_page_title_link,
		content_of : get_page_content,
		// normalize_page_title
		normalize_title : normalize_page_name,
		normalize_title_pattern : normalize_name_pattern,
		section_link : section_link,
		get_hash : list_to_hash,
		unique_list : unique_list,

		parse_dump_xml : parse_dump_xml,
		traversal : traversal_pages,

		Flow : Flow_info,

		guess_language : guess_language,

		revision_cacher : revision_cacher,

		data : wikidata_entity,
		edit_data : wikidata_edit,
		merge_data : wikidata_merge,
		//
		wdq : wikidata_query,
		SPARQL : wikidata_SPARQL,
		petscan : petscan
	});

	return wiki_API;
}
