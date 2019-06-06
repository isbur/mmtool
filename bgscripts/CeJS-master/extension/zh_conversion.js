/**
 * @name CeL function for 繁簡中文字詞彙轉換。
 * 
 * TODO:<br />
 * 在量大的時候，此方法速度頗慢。<br />
 * words conversion
 * 
 * @fileoverview 本檔案包含了繁體/簡體中文轉換的 functions。
 * @example <code>
	// 在非 Windows 平台上避免 fatal 錯誤。
	CeL.env.ignore_COM_error = true;
	// load module for CeL.CN_to_TW('简体')
	CeL.run('extension.zh_conversion',function () {
		// 事前事後轉換表須事先設定。
		//CeL.CN_to_TW.pre = {};
		//CeL.CN_to_TW.post = {};
		var text = CeL.CN_to_TW('简体中文文字');
		CeL.CN_to_TW.file('from.htm', 'to.htm', 'utf-8');
	});
 </code>
 * @see
 * @since 2014/6/17 22:39:16
 */

'use strict';

if (typeof CeL === 'function')
	CeL.run({
		name : 'extension.zh_conversion',
		require : 'data.pair|application.OS.Windows.file.',
		code : function(library_namespace) {
			// requiring
			var pair = this.r('pair');

			/**
			 * null module constructor
			 * 
			 * @class 中文繁簡轉換的 functions
			 */
			var _// JSDT:_module_
			= function() {
				// null module constructor
			};

			/**
			 * for JSDT: 有 prototype 才會將之當作 Class
			 */
			_// JSDT:_module_
			.prototype = {};

			var FLAG = 'gi', CN_to_TW_conversions,
			// using BYVoid / OpenCC 開放中文轉換 (Open Chinese Convert) table.
			// https://github.com/BYVoid/OpenCC/tree/master/data/dictionary
			dictionary_base = library_namespace.get_module_path(this.id,
					'OpenCC' + library_namespace.env.path_separator);
			// console.log('dictionary_base: ' + dictionary_base);

			function CN_to_TW(text, options) {
				if (!CN_to_TW_conversions) {
					// initialization.
					CN_to_TW_conversions = (
					//
					'STPhrases,STCharacters,TWPhrasesName,TWPhrasesIT'
					// 因此得要一個個 replace。
					+ ',TWPhrasesOther,TWVariants,TWVariantsRevPhrases')
							.split(',');

					CN_to_TW_conversions.forEach(function(file_name, index) {
						CN_to_TW_conversions[index]
						// 載入 resource。
						= new pair(null, {
							path : dictionary_base + file_name + '.txt',
							item_processor : function(item) {
								return item.replace(/ .+$/, '');
							}
						});
					});

					// 手動修正表。
					CN_to_TW_conversions.push(new pair(null, {
						path : dictionary_base.replace(/[^\\\/]+[\\\/]$/,
								'corrections.txt'),
						remove_comments : true
					}));

					// 設定事前轉換表。
					if (CN_to_TW.pre)
						CN_to_TW_conversions.unshift(new pair(CN_to_TW.pre, {
							flag : CN_to_TW.flag || FLAG
						}));

					// 設定事後轉換表。
					if (CN_to_TW.post)
						CN_to_TW_conversions.push(new pair(CN_to_TW.post, {
							flag : CN_to_TW.flag || FLAG
						}));
				}

				// 事前轉換表。
				if (options && options.pre)
					text = (new pair(options.pre, {
						flag : options.flag || FLAG
					})).convert(text);

				CN_to_TW_conversions.forEach(function(conversion) {
					text = conversion.convert(text);
				});

				// 事後轉換表。
				if (options && options.post)
					text = (new pair(options.post, {
						flag : options.flag || FLAG
					})).convert(text);

				return text;
			}

			// 提供自行更改的功能。
			CN_to_TW.conversions = CN_to_TW_conversions;

			CN_to_TW.file = function(from, to, target_encoding) {
				var text = library_namespace.get_file(from);
				text = CN_to_TW(text);
				library_namespace.write_file(to, text, target_encoding);
			};

			// 事前事後轉換表須事先設定。
			// 可以 Object.assign(CeL.CN_to_TW.pre = {}, {}) 來新增事前轉換表。
			// CN_to_TW.pre = {};
			// CN_to_TW.post = {};

			_.CN_to_TW = CN_to_TW;

			return (_// JSDT:_module_
			);
		}

	});
