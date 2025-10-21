(function() {
	'use strict';
	
	const LEN_DAY = 86400000;
	const CLOCK_EXPIRE = {};
	
	const rand = WeabooTease.util.rand;
	const linebreak = WeabooTease.util.linebreak;
	
	const aud_h = new Audio('aud/handjob.flac');
	aud_h.loop = true;
	const aud_v = new Audio('aud/vaginal.flac');
	aud_v.loop = true;
	
	function rand_of(arr) {
		return arr[rand(arr.length)];
	}
	
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
	
	WeabooTease.start(async function(body) {
	try {
		const STR = R.STR[body.pref.lang];
	
		let[day, len, skip] = new_day();
		
		if (false && skip < 0) {
			body.set_img(R.IMG.MAIN);
			await body.show_lines(linebreak(
				STR.SP_OLD_DAY.replace('%1', `${(3 + rand(8)) * 5}`)));
			return;
		}
		else if (skip > 0) {
			len += skip;
			localStorage.setItem('LEN_SESSION', len);
			body.set_img(R.IMG.MAIN);
			await body.show_lines(linebreak(
				STR.SP_SKIP_DAY.replace('%1', `${skip}`)));
		}
		else {
			if (day == 0 && skip == 0) {
				body.set_img(R.IMG.PROLOGUE);
				await body.show_lines(linebreak(STR.SP_WELCOME));
			}
			else {
				body.set_img(R.IMG.MAIN);
				await body.show_lines(linebreak(STR.SP_COMEBACK));
			}
		}
		
		body.set_img(rand_of(linebreak(R.IMG.CROWD)));
		await body.show_lines([rand_of(STR.LL_COMEBACK)]);
		await body.show_lines([rand_of(STR.LL_FIRST)]);
		{
			for (let i = 3 + rand(8); i > 0; --i) {
				const gt = body.start_gallery('H');
				aud_h.play();
				await body.ask_react([STR.A_EDGE], 0, rand_of(STR.LL_EDGE), 2000);
				aud_h.pause();
				body.stop_gallery(gt);
				body.set_img(rand_of(linebreak(R.IMG.CROWD)));
				await body.ask_react([STR.A_RESUME], 0, rand_of(STR.LL_REST));
			}
			
			for (let i = 1 + rand(3); i > 0; --i) {
				const gt = body.start_gallery('H');
				aud_h.play();
				await body.ask_react([STR.A_EDGE], 0, rand_of(STR.LL_EDGE), 2000);
				await Promise.all([
					body.start_clock(10000 * (2 + rand(5)), CLOCK_EXPIRE),
					body.ask_react([], 2000, rand_of(STR.LL_HOLD)),
				]);
				aud_h.pause();
				body.stop_gallery(gt);
				body.set_img(rand_of(linebreak(R.IMG.CROWD)));
				await body.ask_react([STR.A_RESUME], 0, rand_of(STR.LL_REST));
			}
		}
		await body.show_lines([rand_of(STR.LL_FIRST_END)]);
		
		body.set_img(rand_of(linebreak(R.IMG.HERO)));
		const ans_cum = await body.ask_react([STR.A_YES, STR.A_NO], 0, rand_of(STR.LL_BET));
		if (ans_cum == 0) {
			await body.show_lines([rand_of(STR.LL_BET_YES)]);
			if (day >= len || day >= body.pref.day_limit) {
				localStorage.removeItem('TIME_START');
				await body.show_lines(linebreak(STR.SP_CUM_OK));
				const gt = body.start_gallery('V');
				aud_v.play();
				await body.ask_react([STR.A_CUM]);
				body.stop_gallery(gt);
				aud_v.pause();
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
				body.set_img(R.IMG.BOSS[0]);
				await body.show_lines(linebreak(STR.SP_G_RUSH));
				let gt = body.start_gallery('V');
				aud_v.play();
				const minutes = 3 + rand(3);
				const timer = body.start_clock(minutes * 60000, CLOCK_EXPIRE);
				let n = 0;
				let dur = 0;
				for (;;) {
					let valid = false;
					{
						const start = Date.now();
						const react = body.ask_react([STR.A_EDGE], 0, STR.L_G_RUSH_KEEP, 2000);
						if (await Promise.any([timer, react]) == CLOCK_EXPIRE) {
							await react;
							break;
						}
						if (Date.now() - start > dur) {
							valid = true;
							n += 1;
						}
						body.stop_gallery(gt);
						gt = undefined;
						body.set_img(R.IMG.BOSS[0]);
						aud_v.pause();
					}
					{
						const start = Date.now();
						const react = body.ask_react([STR.A_RESUME], 0, valid ?
							STR.L_G_RUSH_COUNT
						: STR.L_G_RUSH_NOGO);
						if (await Promise.any([timer, react]) == CLOCK_EXPIRE) {
							await react;
							break;
						}
						dur = Date.now() - start;
						gt = body.start_gallery('V');
						aud_v.play();
					}
				}
				aud_v.pause();
				body.stop_gallery(gt);
				body.set_img(R.IMG.BOSS[0]);
				
				await body.show_lines([STR.L_G_RUSH_RESULT.replace('%1', `${n}`)]);
				const rate = n / minutes;
				const diff = rate - parseFloat(localStorage.getItem('GR_RUSH') ?? 2);
				localStorage.setItem('GR_RUSH', rate);
				if (diff > 1.5) gameresult = 2;
				else if (diff > -0.5) gameresult = 1;
			} break;
			case 1: /*MEM*/ {
				body.set_img(R.IMG.BOSS[1]);
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
				aud_v.play();
				for (let i = 1; i < num; ++i) {
					body.set_img(g[i]);
					const timer = body.start_clock(10000, CLOCK_EXPIRE, true);
					const react = body.ask_react([STR.A_EDGE], 10000, comment, 2000);
					const edged = await Promise.any([timer, react]) == 0;
					await Promise.all([timer, react]);
					if (edged == v[i]) comment = STR.L_G_MEM_GOOD;
					else {
						n += 1;
						comment = STR.L_G_MEM_BAD;
					}
				}
				aud_v.pause();
				body.set_img(R.IMG.BOSS[1]);
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
				body.set_img(R.IMG.BOSS[2]);
				await body.show_lines(linebreak(STR.SP_G_SPEED));
				const len_t = 2 + rand(3);
				let error = 0;
				for (let i = 0; i < len_t; ++i) {
					const gt = body.start_gallery('V');
					if (i > 0) mt = body.play_metronome(inte);
					const timeout = 30 + rand(91);
					for (;;) {
						switch (await body.ask_react([
							STR.A_START,
							STR.A_FASTER,
							STR.A_SLOWER,
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
					
					const timer = body.start_clock(timeout * 1000, CLOCK_EXPIRE);
					const react = body.ask_react([STR.A_EDGE]);
					const p_any = Promise.any([timer, react]);
					const p_all = Promise.all([timer, react]);
					
					const w = await p_any;
					const t = Date.now();
					if (w == 0) body.stop_metronome(mt);
					await p_all;
					const err = Math.floor((Date.now() - t) / 1000);
					if (w != 0) body.stop_metronome(mt);
					
					body.stop_gallery(gt);
					body.set_img(R.IMG.BOSS[2]);
					await body.show_lines([STR.L_G_SPEED_ERR.replace('%1', `${err}`)]);
					error += err;
				}
				
				const rate = error / len_t;
				const diff = rate - parseFloat(localStorage.getItem('GR_SPEED') ?? 0) ;
				localStorage.setItem('GR_SPEED', rate);
				if (diff < -3) gameresult = 2;
				else if (diff < 0.5) gameresult = 1;
				else if (error == 0) gameresult = 1;
			} break;
			case 3: /* BP */ {
				body.set_img(R.IMG.BOSS[3]);
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
				let react = body.ask_react([STR.A_EDGE]);
				let resting = false;
				let n = 0;
				aud_v.play();
				for (let i = 0; i < num; ++i) {
					body.set_img(g[i]);
					const timer = body.start_clock(10000, CLOCK_EXPIRE, true);
					while (await Promise.any([timer, react]) != CLOCK_EXPIRE) {
						if (resting) {
							resting = false;
							aud_v.play();
							react = body.ask_react([STR.A_EDGE]);
						}
						else {
							resting = true;
							aud_v.pause();
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
				aud_v.pause();
				body.set_img(R.IMG.BOSS[3]);
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
			else if (await body.ask_react([STR.A_YES, STR.A_NO], 0, STR.L_MORE) != 0)
				break;
		}
		
		body.set_img(R.IMG.MAIN);
		await body.show_lines(linebreak(STR.SP_DAY.replace('%1', `${(3 + rand(8)) * 5}`)));
		localStorage.setItem('LAST_LOGIN', day);
	} catch (e) { alert(e); }
	});
})();