(function() {
	'use strict';
	
	const LEN_DAY = 86400000;
	const CLOCK_EXPIRE = {};
	
	function rand(max) {
		return Math.floor(Math.random() * max);
	}
	
	function rand_of(arr) {
		return arr[rand(arr.length)];
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
		
		_clean() {
			this.reactbar.removeAttribute('data-active');
			this.reactbar.textContent = '';
			this.speechbox.removeAttribute('data-hint');
		},
		
		_restore_pref() {
			document.querySelector(`input[type=radio][name=lang][value=${this.pref.lang}]`).checked = true;
			this.input_day_limit.value = this.pref.day_limit;
			document.querySelector(`input[type=radio][name=react][value=${this.pref.react_pos}]`).checked = true;
		},
		
		init(game_script) {
			{
				let lang = localStorage.getItem('PREF_LANG')
					?? navigator.language.match('.+?(?=\-|$)')[0];
				this.pref.lang =
					document.querySelector(`input[type=radio][name=lang][value=${lang}]`) ? lang : 'en';
			}
			this.pref.day_limit = parseInt(localStorage.getItem('PREF_DAY_LIMIT') ?? 10);
			this.pref.react_pos = localStorage.getItem('PREF_REACT_POS') ?? 'hrz';
			this.img_main.decoding = 'sync';
			this._restore_pref();
			
			const body = this;
			this.b_start.onclick = function() {
				body.img_main.src = R.IMG.MAIN;
				body.reactbar.setAttribute('data-align', body.pref.react_pos);
				body.scene_start.removeAttribute('data-active');
				body.scene_pic.setAttribute('data-active', '');
				game_script(body).then(function() {
					body.scene_pic.removeAttribute('data-active');
					body.scene_start.setAttribute('data-active', '');
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
					const v = document.querySelector('input[type=radio][name=lang]:checked')?.value ?? 'en';
					if (body.pref.lang != v) {
						body.pref.lang = v;
						localStorage.setItem('PREF_LANG', v);
					}
				}
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
			function shuffle() {
				for (let i = 0; i < len; ++i) indices[i] = i;
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
			this.img_main.src = R.IMG.MAIN;
		},
		
		set_img(img) {
			this.img_main.src = img;
		},
		
		unset_img() {
			this.img_main.src = R.IMG.MAIN;
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
		
		start_clock(timeout, hidden) {
			if (hidden) return new Promise(function(resolve, reject) {
				setTimeout(function() { resolve(CLOCK_EXPIRE); }, timeout);
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
						resolve(CLOCK_EXPIRE);
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
					body._clean();
					clearTimeout(timer_hint);
					resolve(-1);
				}, timeout);
				for (const[i, str] of reacts.entries()) {
					const r = document.createElement("div");
					r.className = "react";
					r.textContent = str;
					r.onclick = function() {
						body._clean();
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
	
	function reset_game() {
		localStorage.setItem('TIME_START', Date.now() - LEN_DAY / 2);
		localStorage.removeItem('LAST_LOGIN');
		
		const len = 1 + rand(5);
		localStorage.setItem('LEN_SESSION', len);
		
		localStorage.setItem('LEN_SESSION_FRAC', 0);
		
		return [0, len, 0];
	}
	
	function new_day() {
		const start = parseInt(localStorage.getItem('TIME_START'));
		if (Number.isNaN(start)) return reset_game();
		
		const len = parseInt(localStorage.getItem('LEN_SESSION'));
		if (Number.isNaN(len)) return reset_game();
		if (len < 0 || len > 0xFF) return reset_game();
		
		let day = Math.floor((Date.now() - start) / LEN_DAY);
		const skip = day - parseInt(localStorage.getItem('LAST_LOGIN') ?? day - 1) - 1;
		
		if (skip > 0) {
			day -= skip;
			localStorage.setItem('TIME_START', start + skip * LEN_DAY);
		}
		
		return [day, len, skip];
	}
	
	body.init(async function(body) { try {
		const STR = R.STR[body.pref.lang];
	
		let [day, len, skip] = new_day();

		if (skip < 0) {
			await body.show_lines(linebreak(
				STR.SP_OLD_DAY.replace('%1', `${(3 + rand(8)) * 5}`)));
			return;
		}
		else if (skip > 0) {
			len += skip;
			localStorage.setItem('LEN_SESSION', len);
			await body.show_lines(linebreak(
				STR.SP_SKIP_DAY.replace('%1', `${skip}`)));
		}
		else {
			if (day == 0)
				await body.show_lines(linebreak(STR.SP_WELCOME));
			else {
				await body.show_lines(linebreak(STR.SP_COMEBACK));
				await body.show_lines([rand_of(STR.LL_COMEBACK)]);
			}
		}
		
		await body.show_lines([rand_of(STR.LL_FIRST)]);
		{
			const gt = body.start_gallery('H');
			for (let i = 3 + rand(8); i > 0; --i) {
				await body.ask_react(['Edge'], 0, rand_of(STR.LL_EDGE), 2000);
				await body.ask_react(['Rested'], 0, rand_of(STR.LL_REST));
			}
			
			for (let i = 1 + rand(3); i > 0; --i) {
				await body.ask_react(['Edge'], 0, rand_of(STR.LL_EDGE), 2000);
				await Promise.all([
					body.start_clock(10000 * (2 + rand(5))),
					body.ask_react([], 2000, rand_of(STR.LL_HOLD)),
				]);
				await body.ask_react(['Rested'], 0, rand_of(STR.LL_REST));
			}
			body.stop_gallery(gt);
		}
		await body.show_lines([rand_of(STR.LL_FIRST_END)]);
		
		const ans_cum = await body.ask_react(['Yes', 'No'], 0, rand_of(STR.LL_BET));
		if (ans_cum == 0) {
			await body.show_lines([rand_of(STR.LL_BET_YES)]);
			if (day >= len || day >= body.pref.day_limit) {
				localStorage.removeItem('TIME_START');
				await body.show_lines(linebreak(STR.SP_CUM_OK));
				const gt = body.start_gallery('V');
				await body.ask_react(['Cum']);
				body.stop_gallery(gt);
				await body.show_lines(linebreak(STR.SP_FINISH));
				return;
			}
			else {
				len += 1;
				localStorage.setItem('LEN_SESSION', len);
				await body.show_lines(linebreak(STR.SP_CUM_NOGO));
				await body.show_lines([STR.L_LEN_ADD]);
			}
		}
		else await body.show_lines([rand_of(STR.LL_BET_NO)]);

		let num_game = 1;
		for (;;) {
			const choice = rand(4);
		
			let gameresult = 0;
			switch (choice) {
			default:
			case 0: /*RUSH*/ {
				await body.show_lines(linebreak(STR.SP_G_RUSH));
				const gt = body.start_gallery('V');
				const minutes = 3 + rand(3);
				const timer = body.start_clock(minutes * 60000);
				let n = 0;
				let dur = 0;
				for (;;) {
					let valid = false;
					{
						const start = Date.now();
						const react = body.ask_react(['Edge'], 0, STR.L_G_RUSH_KEEP, 2000);
						if (await Promise.any([timer, react]) == CLOCK_EXPIRE) {
							await react;
							break;
						}
						if (Date.now() - start > dur) {
							valid = true;
							n += 1;
						}
					}
					{
						const start = Date.now();
						const react = body.ask_react(['Resume'], 0, valid ?
							STR.L_G_RUSH_COUNT
						: STR.L_G_RUSH_NOGO);
						if (await Promise.any([timer, react]) == CLOCK_EXPIRE) {
							await react;
							break;
						}
						dur = Date.now() - start;
					}
				}
				body.stop_gallery(gt);
				
				await body.show_lines([STR.L_G_RUSH_RESULT.replace('%1', `${n}`)]);
				const rate = n / minutes;
				const diff = rate - parseFloat(localStorage.getItem('GR_RUSH') ?? 2);
				localStorage.setItem('GR_RUSH', rate);
				if (diff > 1.5) gameresult = 2;
				else if (diff > -0.5) gameresult = 1;
			} break;
			case 1: /*MEM*/ {
				await body.show_lines(linebreak(STR.SP_G_MEM));
				const num = 18 + rand(13);
				const g = new Array(num);
				const v = new Array(num);
				{
					const gn = linebreak(R.IMG['V']);
					const len_g = gn.length;
					let c_last = rand(len_g);
					g[0] = gn[c_last];
					v[0] = false;
					const e = new Array(len_g);
					e[c_last] = true;
					for (let i = 1; i < len_g; ++i) {
						const c = rand(len_g - 1);
						c_last = c < c_last ? c : c + 1;
						g[i] = gn[c_last];
						if (e[c_last]) v[i] = true;
						else {
							e[c_last] = true;
							v[i] = false;
						}
					}
				}
				
				let n = 0;
				let comment = STR.L_G_MEM_BEGIN;
				for (let i = 1; i < num; ++i) {
					body.set_img(g[i]);
					const timer = body.start_clock(10000, true);
					const react = body.ask_react(['Edge'], 10000, comment, 2000);
					const edged = await Promise.any([timer, react]) == 0;
					await Promise.all([timer, react]);
					if (edged == v[i]) comment = STR.L_G_MEM_GOOD;
					else {
						n += 1;
						comment = STR.L_G_MEM_BAD;
					}
				}
				body.unset_img();
				await body.show_lines([
					comment,
					STR.L_G_MEM_RESULT.replace('%1', `${n}`),
				]);
				
				const rate = n / num;
				const diff = rate - parseFloat(localStorage.getItem('GR_MEM') ?? 0);
				localStorage.setItem('GR_MEM', rate);
				if (diff < -0.12) gameresult = 2;
				else if (diff < 0.04) gameresult = 1;
				else if (n == 0) gameresult = 1;
			} break;
			case 2: /*SPEED*/ {
				let inte = 1000;
				let mt = body.play_metronome(inte);
				await body.show_lines(linebreak(STR.SP_G_SPEED));
				const gt = body.start_gallery('V');
				const len_t = 2 + rand(3);
				let error = 0;
				for (let i = 0; i < len_t; ++i) {
					if (i > 0) mt = body.play_metronome(inte);
					const timeout = 30 + rand(91);
					for (;;) {
						switch (await body.ask_react([
							'Start',
							'Faster',
							'Slower',
						], 0, STR.L_G_SPEED_INFO.replace('%1', `${timeout}`))) {
						default:
						case 0: break;
						case 1:
							if (inte > 200) {
								inte -= 200;
								body.stop_metronome(mt);
								mt = body.play_metronome(inte);
							}
							continue;
						case 2:
							if (inte < 2000) {
								inte += 200;
								body.stop_metronome(mt);
								mt = body.play_metronome(inte);
							}
							continue;
						}
						break;
					}
					
					const timer = body.start_clock(timeout * 1000);
					const react = body.ask_react(['Edge']);
					const p_any = Promise.any([timer, react]);
					const p_all = Promise.all([timer, react]);
					
					const w = await p_any;
					const t = Date.now();
					if (w == 0) body.stop_metronome(mt);
					await p_all;
					const err = Math.floor((Date.now() - t) / 1000);
					if (w != 0) body.stop_metronome(mt);
					
					await body.show_lines([STR.L_G_SPEED_ERR.replace('%1', `${err}`)]);
					error += err;
				}
				body.stop_gallery(gt);
				
				const rate = error / len_t;
				const diff = rate - parseFloat(localStorage.getItem('GR_SPEED') ?? 0) ;
				localStorage.setItem('GR_SPEED', rate);
				if (diff < -3) gameresult = 2;
				else if (diff < 0.5) gameresult = 1;
				else if (error == 0) gameresult = 1;
			} break;
			case 3: /* BP */ {
				await body.show_lines(linebreak(STR.SP_G_BP));
				const num = 18 + rand(13);
				const g = new Array(num);
				const v = new Array(num);
				let count = 0;
				{
					const gn_v = linebreak(R.IMG['V']);
					const gn_h = linebreak(R.IMG['H']);
					const len_v = gn_v.length;
					const len_h = gn_h.length;
					let c_last = undefined;
					let b = true;
					for (let i = 0, j = 0; i < num; ++i, --j) {
						if (j <= 0) {
							j = 1 + rand(5);
							b = !b;
							
							v[i] = b;
							if (b) {
								c_last = rand(len_h);
								g[i] = gn_h[c_last];
								count += 1;
							}
							else {
								c_last = rand(len_v);
								g[i] = gn_v[c_last];
							}
						}
						else {
							v[i] = b;
							if (b) {
								const c = rand(len_h - 1);
								c_last = c < c_last ? c : c + 1;
								g[i] = gn_h[c_last];
							}
							else {
								const c = rand(len_v - 1);
								c_last = c < c_last ? c : c + 1;
								g[i] = gn_v[c_last];
							}
						}
					}
				}
				let react = body.ask_react(['Edge']);
				let resting = false;
				let n = 0;
				for (let i = 0; i < num; ++i) {
					body.set_img(g[i]);
					const timer = body.start_clock(10000, true);
					while (await Promise.any([timer, react]) != CLOCK_EXPIRE) {
						if (resting) {
							resting = false;
							react = body.ask_react(['Edge']);
						}
						else {
							resting = true;
							if (v[i]) {
								n += 1;
								react = body.ask_react([], 5000, STR.L_G_BP_GOOD);
							}
							else {
								n -= 1;
								react = body.ask_react([], 5000, STR.L_G_BP_BAD);
							}
						}
					}
				}
				body.unset_img();
				await react;
				
				await body.show_lines([STR.L_G_BP_RESULT.replace('%1', `${n}`)]);
				const rate = n / count;
				const diff = rate - parseFloat(localStorage.getItem('GR_BP') ?? 1);
				localStorage.setItem('GR_BP', rate);
				if (diff > 0.6) gameresult = 2;
				else if (diff > -0.2) gameresult = 1;
			} break;
			/*case 4: {
				//wanting new ideas
			} break;*/
			}
			
			switch (gameresult) {
			default:
			case 0: {
				await body.show_lines([rand_of(STR.LL_GAME_BAD)]);
				const frac = parseInt(localStorage.getItem('LEN_SESSION_FRAC') ?? 0);
				if (frac < 60) localStorage.setItem('LEN_SESSION_FRAC', frac + 40);
				else {
					localStorage.setItem('LEN_SESSION_FRAC', frac - 60);
					len += 1;
					localStorage.setItem('LEN_SESSION', len);
					await body.show_lines([STR.L_LEN_ADD]);
				}
			} break;
			case 1:
				await body.show_lines([rand_of(STR.LL_GAME_NOTBAD)]);
				break;
			case 2: {
				await body.show_lines([rand_of(STR.LL_GAME_GOOD)]);
				const frac = parseInt(localStorage.getItem('LEN_SESSION_FRAC') ?? 0);
				if (frac >= 40) localStorage.setItem('LEN_SESSION_FRAC', frac - 40);
				else {
					localStorage.setItem('LEN_SESSION_FRAC', frac + 60);
					len -= 1;
					localStorage.setItem('LEN_SESSION', len);
					await body.show_lines([STR.L_LEN_SUB]);
				}
			} break;
			}
			
			if (num_game > 0) num_game -= 1;
			else if (await body.ask_react(['Yes', 'No'], 0, STR.L_MORE) != 0)
				break;
		}
		
		await body.show_lines(linebreak(STR.SP_DAY.replace('%1', `${(3 + rand(8)) * 5}`)));
		localStorage.setItem('LAST_LOGIN', day);
		
	} catch (e) { alert(e); }
	});
})();