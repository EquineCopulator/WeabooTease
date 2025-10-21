(function() {
	'use strict';
	
	function rand(max) {
		return Math.floor(Math.random() * max);
	}
	
	function format_time(time) {
		const sec = time % 60;
		return `${Math.floor(time / 60)}:${sec < 10 ? '0' : ''}${sec}`;
	}
	
	function linebreak(lines) {
		return lines.split('\n').filter(function(l) {
			return l.match('\\S');
		});
	}
	
	const body = {
		pref:{},
		
		scene_start:document.getElementById('scene_start'),
		b_start:document.getElementById('b_start'),
		b_settings:document.getElementById('b_settings'),
		b_credits:document.getElementById('b_credits'),
		
		scene_pic:document.getElementById('scene_pic'),
		img_main:document.getElementById('img_main'),
		img_gallery:document.getElementById('img_gallery'),
		speechbox:document.getElementById('speechbox'),
		speechline:document.getElementById('speechline'),
		clock:document.getElementById('clock'),
		clock_time:document.getElementById('clock_time'),
		reactbar:document.getElementById('reactbar'),
		metronome:new Audio('sc/ui/metronome.wav'),
		
		scene_settings:document.getElementById('scene_settings'),
		b_back_settings:document.getElementById('b_back_settings'),
		b_save_settings:document.getElementById('b_save_settings'),
		b_reset:document.getElementById('b_reset'),
		input_day_limit:document.getElementById('day_limit'),
		
		scene_credits:document.getElementById('scene_credits'),
		b_back_credits:document.getElementById('b_back_credits'),
		
		_react_end() {
			this.reactbar.removeAttribute('data-active');
			this.reactbar.textContent = '';
			this.speechbox.removeAttribute('data-hint');
		},
		
		_ui_tr() {
			const I = [
				['Weaboo Tease', '百百人发电', 'ミリシコ'],
				['Start', '开始', '遊ぶ'],
				['Settings', '设置', '設定'],
				['Reset data', '重置数据', 'データリセット'],
				['Language: ', '语言', '言語'],
				['Days upper limit: ', '天数上限', '日数上限'],
				['Buttons position: ', '按钮位置', 'ボタン位置'],
				['Bottom', '下', '下'],
				['Left', '左', '左'],
				['Right', '右', '右'],
			];
			
			let lang = this.pref.lang;
			let index = 0;
			switch (lang) {
			default:
			case 'en': this.pref.lang = 'en', lang = 'en'; break;
			case 'zh': index = 1; break;
			case 'ja': index = 2; break;
			}
			
			const ui = document.getElementsByClassName('ui-tr');
			for (let i = 0; i < I.length; ++i) {
				ui.item(i).textContent = I[i][index];
			}
			document.documentElement.lang = lang;
		},
		
		init(game_script) {
			this.pref.lang = localStorage.getItem('PREF_LANG')
				?? navigator.language.match('.+?(?=\-|$)')[0];
			this._ui_tr();
			this.pref.day_limit = parseInt(localStorage.getItem('PREF_DAY_LIMIT') ?? 10);
			this.pref.react_pos = localStorage.getItem('PREF_REACT_POS') ?? 'hrz';
			
			document.querySelector(`input[type=radio][name=lang][value=${this.pref.lang}]`).checked = true;
			this.input_day_limit.value = this.pref.day_limit;
			document.querySelector(`input[type=radio][name=react][value=${this.pref.react_pos}]`).checked = true;
			
			this.img_main.decoding = 'sync';
			
			const body = this;
			this.b_start.onclick = function() {
				body.reactbar.setAttribute('data-align', body.pref.react_pos);
				body.scene_start.removeAttribute('data-active');
				body.scene_pic.setAttribute('data-active', '');
				game_script(body).then(function() {
					body.scene_pic.removeAttribute('data-active');
					body.scene_start.setAttribute('data-active', '');
					body.img_main.removeAttribute('src');
				});
			};
			this.b_settings.onclick = function() {
				body.scene_start.removeAttribute('data-active');
				body.scene_settings.setAttribute('data-active', '');
			};
			this.b_credits.onclick = function() {
				body.scene_start.removeAttribute('data-active');
				body.scene_credits.setAttribute('data-active', '');
			};
			
			this.b_back_settings.onclick = function() {
				body.scene_settings.removeAttribute('data-active');
				body.scene_start.setAttribute('data-active', '');
				
				{
					const v = body.input_day_limit.value;
					if (body.pref.day_limit != v) {
						body.pref.day_limit = v;
						localStorage.setItem('PREF_DAY_LIMIT', v);
					}
				}
				{
					const v = document.querySelector('input[type=radio][name=react]:checked')?.value ?? 'hrz';
					if (body.pref.react_pos != v) {
						body.pref.react_pos = v;
						localStorage.setItem('PREF_REACT_POS', v);
					}
				}
				{
					const v = document.querySelector('input[type=radio][name=lang]:checked')?.value ?? 'en';
					if (body.pref.lang != v) {
						body.pref.lang = v;
						localStorage.setItem('PREF_LANG', v);
						body._ui_tr();
					}
				}
			};
			this.b_reset.onclick = function() {
				localStorage.removeItem('TIME_START');
				localStorage.removeItem('GR_RUSH');
				localStorage.removeItem('GR_MEM');
				localStorage.removeItem('GR_SPEED');
				localStorage.removeItem('GR_BP');
				alert("User data reset successfully.");
			};
			
			this.b_back_credits.onclick = function() {
				body.scene_credits.removeAttribute('data-active');
				body.scene_start.setAttribute('data-active', '');
			}
			
			this.scene_start.setAttribute('data-active', '');
		},
		
		start_gallery(name) {
			const g = linebreak(R.IMG[name]);
			const len = g.length;
			const indices = new Array(len);
			for (let i = 0; i < len; ++i) indices[i] = i;
			function shuffle() {
				for (let i = 0; i < len; ++i) {
					const i2 = i + rand(len - i);
					const v = indices[i2];
					indices[i2] = indices[i];
					indices[i] = v;
				}
			}
			shuffle();
			
			let n = 0;
			const body = this;
			function pic() {
				body.img_main.src = g[indices[n]];
				n += 1;
				if (n >= len) {
					shuffle();
					n = 0;
				}
			}
			
			pic();
			return setInterval(pic, 5000);
		},
		
		stop_gallery(timer) {
			clearInterval(timer);
		},
		
		set_img(img) {
			this.img_main.src = img;
		},
		
		unset_img() {
			this.img_main.removeAttribute('src');
		},
		
		play_metronome(interval) {
			const body = this;
			return setInterval(function() {
				body.metronome.currentTime = 0;
				body.metronome.play();
			}, interval);
		},
		
		stop_metronome(timer) {
			clearInterval(timer);
		},
		
		/* async methods */
		
		start_clock(timeout, token, hidden) {
			if (hidden) return new Promise(function(resolve, reject) {
				setTimeout(function() { resolve(token); }, timeout);
			});
			this.clock_time.textContent = format_time(Math.floor(timeout / 1000));
			this.clock.setAttribute('data-active', '');
			const body = this;
			return new Promise(function(resolve, reject) {
				let timer = undefined;
				const end = Date.now() + timeout;
				timer = setInterval(function() {
					const det = end - Date.now();
					if (det > 0)
						body.clock_time.textContent = format_time(Math.round(det / 1000));
					else {
						clearInterval(timer);
						body.clock.removeAttribute('data-active');
						resolve(token);
					}
				}, 1000);
			});
		},
		
		show_lines:async function(lines) {
			this.speechbox.setAttribute('data-active', '');
			for (const line of lines) {
				this.speechline.textContent = line;
				const body = this;
				await new Promise(function(resolve, reject) {
					body.scene_pic.addEventListener('click', function handle() {
						body.scene_pic.removeEventListener('click', handle);
						resolve(undefined);
					});
				});
			}
			this.speechbox.removeAttribute('data-active');
		},
		
		ask_react(reacts, timeout, hint, timehint) {		
			let timer_hint = undefined;
			if (hint) {
				this.speechbox.setAttribute('data-hint', '');
				this.speechline.textContent = hint;
				if (timehint > 0 && (!(timeout > 0) || timeout > timehint)) {
					const body = this;
					timer_hint = setTimeout(function() {
						body.speechbox.removeAttribute('data-hint');
					}, timehint);
				}
			}
			
			const body = this;
			return new Promise(function(resolve, reject) {
				let timer = undefined;
				if (timeout > 0) timer = setTimeout(function() {
					body._react_end();
					clearTimeout(timer_hint);
					resolve(-1);
				}, timeout);
				for (const[i, str] of reacts.entries()) {
					const r = document.createElement("div");
					r.className = "react";
					r.textContent = str;
					r.onclick = function() {
						body._react_end();
						clearTimeout(timer);
						clearTimeout(timer_hint);
						setTimeout(function() { resolve(i); });
					}
					body.reactbar.appendChild(r);
				}
				body.reactbar.setAttribute('data-active', '');
			});
		},
	};
	
	Object.defineProperty(globalThis, "WeabooTease", {
		value:{
			util:{
				rand:rand,
				linebreak:linebreak,
			},
			start(game_script) {
				body.init(game_script);
			},
		},
	});
})();