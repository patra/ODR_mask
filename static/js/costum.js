function compute_factor(){

	params = session["params"]
	n_stims = params["stims"]

	factor = 1/math.sum(n_stims)

	if (factor > 1)
		psiTurk.showPage('error.html');

	return factor/session["total_trials"]*n_stims.length

}


var nanobar = function(){

	if (session["bar"] == undefined){

		var options1 = {
		  classname: 'my-class',
		  id: 'nanobar_total',
		  target: document.getElementById('bar1'),
		  size: 100
		};

		var options2 = {
		  classname: 'my-class',
		  id: 'nanobar_correct',
		  target: document.getElementById('bar2')
		};
	
		session["bar"] = []
		nanobar_total = new Nanobar(options1);
		nanobar_correct = new Nanobar(options2);
		session["bar"].push(nanobar_total)
		session["bar"].push(nanobar_correct)
	}

	total = (session["trial_number"])/session["total_trials"]*100
	correct = session["acc_rwd"]*100

	session["bar"][0].go(total)
	session["bar"][1].go(correct)

	return session["bar"]
}

var default_params = function (type){

	params={}
	params["max_reward"] = 10

	if (type) { 
	    params["n_trials"] = 1
	    params["stims"] = [1,3]
	    params["delays"] = [1]
    }
    else {
	    params["n_trials"] = 10
		params["stims"] = [1,3,2,5]
		params["delays"] = [0,3]
	}

	params["total_trials"] = 2*params["n_trials"]*params["stims"].length*params["delays"].length
	return params
}

var gen_trials2 = function(params,callback){

	keys = Object.keys(params)
	url = "/get_stims?"+keys[0]+"="+params[keys[0]]
	for (i=1;i<keys.length;i++) {
		k=keys[i]
		url+="&"+k+"="+params[k]
	}

			$.ajax({
			dataType: "json",
			url: url,
			success: function(data) {
				callback(data.results,params)
			}
		})
}


var oscilate = function(freq){
	y = math.sin(2*math.pi*freq*(Date.now()-session['start_time'])/1000);
	return y
}

var flicker_stim = function(){
	if (session["state"] != DELAY){
		return
	}
	stim = d3.select("#all_stims").select("#stim"+session["correct"])[0][0]
	if (!stim){
		return
	}

	//rad = STIM_SIZE*(oscilate(100)+1)/2;
	rad = STIM_SIZE
	if(oscilate(session["freq"])<0){
		rad = 0
	}

	stim.setAttribute("r",rad)
	window.requestAnimationFrame(flicker_stim)

}

var flicker_all_stim = function(){

	// if ((session["state"] != REPORT) && (session["state"] != DELAY)){
	// 	return
	// }

	// if ((session["state"] != DELAY)){
	// 	return
	// }

	if (session["state"] != REPORT){
		return
	}
	
	// rad = STIM_SIZE
	// if(oscilate(session["freq"])<0){
	// 	rad = 0
	// }

	// oscilate() -> [-1,1] => abs(oscilate()/2)=> [0-1]
	rad = math.abs(STIM_SIZE*(oscilate(session["freq"]/2)))

	var all_stims = d3.select("#all_stims").selectAll("[id^='stim']")[0]
	var n_stims = all_stims.length


	while (n_stims) {
		var stim = all_stims[n_stims-1];
		stim.setAttribute("r",rad)
		n_stims--
	}

	window.requestAnimationFrame(flicker_all_stim)

}

var flicker_correct = function(){
	// if (session["state"] != FINISH){
	// 	return
	// }
	stim = d3.select("#all_stims").select("#stim"+session["correct"])[0][0]
	if (!stim){
		return
	}

	rad = (STIM_SIZE*.25)*(oscilate(0.5)+1)/2 + STIM_SIZE;

	stim.setAttribute("r",rad)
	window.requestAnimationFrame(flicker_correct)

}

var flicker_background=function(){

	background=d3.select("#all_stims")[0][0]
	body=d3.select("body")[0][0]
	cont=d3.select("#container-exp")[0][0]


	if (session["state"] != REPORT){
		background.setAttribute("style","background-color: white")
		body.setAttribute("style","background-color: white")
		cont.setAttribute("style","background-color: white")


		session["background"]=WHITE
		return
	}


	background.setAttribute("style","background-color: white")
	body.setAttribute("style","background-color: white")
	cont.setAttribute("style","background-color: white")


	session["background"]=WHITE

	if(oscilate(session["freq"])<0){
		background.setAttribute("style","background-color: lightgray")
		body.setAttribute("style","background-color: lightgray")
		cont.setAttribute("style","background-color: lightgray")

		session["background"] = BLACK
	}

	window.requestAnimationFrame(flicker_background)

}

var fade_fix = function(tau){
	var init_time = new Date().getTime()/1000;
	for (delta = 0; math.exp(delta*tau)>0.1; delta = (init_time - new Date().getTime()/1000))
		console.log(math.exp(delta)/tau,delta)
}

var gen_catches = function(){

	// flip coin to determine if catch trial?

	n_catch = 0;
	t=0;
	max_dur = PRES_DUR+session["delay"];

	while(n_catch<MAX_CATCH && t<max_dur){
		t+=math.random(max_dur)
		if (t+CATCH_TIMEOUT<max_dur){
			setTimeout(function () {run_catch(session['trial_number'])},t)
			setTimeout(function () {catch_timeout()},t+CATCH_TIMEOUT)
			n_catch++
			t+=CATCH_INTERVAL+CATCH_TIMEOUT
		}
	}
	console.log(n_catch+" catch trial run")
}

var run_catch = function(trial_number){
		session['catch_t'] = new Date().getTime()
		session['in_catch']=1
		flip_fixation("red");
}

var catch_timeout = function(){
	if (session['in_catch']){
		session['in_catch'] = 0;
		flip_fixation("black");
		console.log("catch timed out.")
		session['catch_false']++
	}
}



var space_detector_down = function(e){
	if (e.keyCode == SPACE){
		session["space"] = DOWN;
	}
}

var flip_fixation_old=function(s){
	if (!session['in_catch'])
		return 
	// if a catch moment, set fix to gray and callback to recover after FLIP_DUR
	if (s){
		session['n_catch']++
		$("#fixation")[0].setAttribute("style","fill: red");
		setTimeout(function () {flip_fixation(0)},FLIP_DUR)

	}
	// back to normal
	else {
		$("#fixation")[0].setAttribute("style","fill: black")
	}
}


var flip_fixation=function(color){
	$("#fixation")[0].setAttribute("style","fill: "+color);
}


var session_init=function(){

	session['catch_trial'] = 0;
	session['wheel_on'] = 0;
	session['listening'] = 0;
	session['catch_false'] = 0;

	// not clear what to do here
	session['space'] = DOWN;
	session['in_catch'] = 0
	session['is_catch'] = 0
	session['catch_rt'] = []
	session['n_catch'] = 0
	session['catch_t'] = math.Infinity
	session["background"] = WHITE
}


var feedback = function(report_pos,report_angle){

	report_color = angle2rgb(report_angle);
	correct = session["trial"][session['correct']];
	correct_color = correct["color"]
	correct_pos = angle2pos(correct_color,WHEEL_Y/2-21,CENTER)

	if (math.abs(circ_dist(report_angle, correct_color)) > CORRECT_THR){
		feed_text = "wrong"
		fill = "red"
	}
	else{
		feed_text = "correct"
		fill = "green"
		session["n_correct"]++
		session["acc_rwd"] += session["factor"]*session["n_stims"] 
	}

	// rotate correct color for this wheel rotation
	// report angle was rotated on main routine, so also rotating it back
	correct_angle = circ_dist(correct_color,wheel_offset[session["wheel_n"]])
	report_angle =  circ_dist(report_angle,wheel_offset[session["wheel_n"]])


	screen.insert("text")
		.attr("x",CENTER[0]-80)
		.attr("y", CENTER[1]-80)
		.attr("id","feedback")
		.attr("font-size",50)
		.attr("font-family","Verdana")
	
	feed = $("#feedback")[0]

	feed.innerHTML=feed_text
	feed.setAttribute("fill", fill)


	screen.insert("circle")
		.attr("cx", report_pos[0])
		.attr("cy", report_pos[1])
		.attr("r", STIM_SIZE)
		.style("fill", encapsulate_rgb(report_color))
		// .style("stroke", stroke)
		.style("stroke-width","4px")
		.attr("fill-opacity","1");



	// correct_pos_r = angle2pos(circ_dist(correct_angle,0.5),WHEEL_Y/2-21,CENTER)
	// correct_pos_l = angle2pos(circ_dist(correct_angle,-0.5),WHEEL_Y/2-21,CENTER)

	// screen.insert("line")
	// 	.attr("x1", CENTER[0])
	// 	.attr("y1", CENTER[1])
	// 	.attr("x2", correct_pos_r[0])
	// 	.attr("y2", correct_pos_r[1])
	// 	.style("stroke", "black")
	// 	.style("stroke-width","4px")
	// 	.style("stroke-dasharray","5,5")
	// 	.attr("fill-opacity","1");


	// screen.insert("line")
	// 	.attr("x1", CENTER[0])
	// 	.attr("y1", CENTER[1])
	// 	.attr("x2", correct_pos_l[0])
	// 	.attr("y2", correct_pos_l[1])
	// 	.style("stroke", "black")
	// 	.style("stroke-width","4px")
	// 	.style("stroke-dasharray","5,5")
	// 	.attr("fill-opacity","1");

	stim = d3.select("#all_stims").select("#stim"+session["correct"])[0][0]
	stim.setAttribute("style","fill: "+encapsulate_rgb(angle2rgb(correct_color)))
	stim.setAttribute("stroke-width","8px")



}

var get_correct = function(){
	trial = session["trial"]
	for(i=0;i<trial.length;i++)
		if (trial[i]["correct"])
			break

	return i
}

var bold_correct= function(screen){
	stim = d3.select("#all_stims").select("#stim"+session["correct"])[0][0]
	stim.setAttribute("style","fill: black")

}

var draw_stims=function(screen){

	for(i=0;i<session["trial"].length;i++){
		stim = session["trial"][i]
		screen.insert("circle")
			.attr("id","stim"+i)
			.attr("cx", stim['pos_x']-STIM_SIZE)
			.attr("cy", stim['pos_y']-STIM_SIZE)
			.attr("r", STIM_SIZE)
			.style("fill", encapsulate_rgb(angle2rgb(stim['color'])))
			.style("stroke", "black")
			.style("stroke-width","0px")
			.attr("fill-opacity","1")

	}
}


var flip_background=function(){
	background=d3.select("#all_stims")[0][0]	

	if (session["background"] == WHITE){
		background.setAttribute("style","background-color: lightgray")
		session["background"] = BLACK
	}
	else{
		background.setAttribute("style","background-color: white")
		session["background"]=WHITE
	}
}

var hide_stimulus = function(){
	var all_stims = d3.select("#all_stims").selectAll("[id^='stim']")[0]
	var n_stims = all_stims.length

	while (n_stims) {
		var stim = all_stims[n_stims-1];
		stim.setAttribute("style","fill: lightgray");
		stim.setAttribute("fill-opacity","0")
		n_stims--
	}

}

var blank_stimuli = function(){
	var all_stims = d3.select("#all_stims").selectAll("[id^='stim']")[0]
	// var n_stims = all_stims.length
	n_stims = session["n_stims"]


	while (n_stims) {
		var stim = all_stims[n_stims-1];
		stim.setAttribute("style","fill: gray");
		stim.setAttribute("fill-opacity","1")
		stim.setAttribute("r",STIM_SIZE)
		n_stims--
	}
}

var drop_stimuli = function(){
	var all_stims = d3.select("#all_stims").selectAll("[id^='stim']")[0]
	var n_stims = all_stims.length

	// flip coin to know how many stim will be droped/turned invisible
	var n_drop = math.randomInt(0,all_stims.length)
	session["n_drop"] = n_drop

	// flip #n_drop coins to know which stims will be dropped, drop them and log it
	session["dropped"] = []

	while (n_drop) {
		not_done = true
		while (not_done){
			stim = math.randomInt(0,all_stims.length)
			not_done = stim in session["dropped"]
		}
		session["dropped"].push(stim)
		all_stims[stim].setAttribute("style","fill: white");
		n_drop--
	}
}

var draw_wheel = function(screen){
	screen
		.insert("svg:image")
		.attr("id","wheel")
		.attr('x',CENTER[0]-WHEEL_X/2)
		.attr('y',CENTER[1]-WHEEL_Y/2)
		.attr('width', WHEEL_X)
		.attr('height', WHEEL_Y)
		.attr("xlink:href",images[session["wheel_n"]])
}

var hide_wheel = function(screen){
	d3.select("#wheel").remove()
}

var clean_trial = function() {
	d3.select("#stims").selectAll("center").remove()
};

var start_screen = function(){
	clean_trial();
	var screen = d3.select("#stims")
			  .insert("center")
			  .insert("svg")
			  .attr("id", "all_stims")
			  .attr("width", SCR_X)
			  .attr("height", SCR_Y)
	return screen
}

var draw_fix = function(screen,color){
	screen.insert("rect")
		.attr("id","fixation")
		.attr("x",SCR_X/2-FIX_SIZE/2)
		.attr("y", SCR_Y/2-FIX_SIZE/2)
		.attr("width",FIX_SIZE)
		.attr("height",FIX_SIZE)
		.style("fill", color)
		.style("stroke", "black")
		.style("stroke-width","4px")
		.attr("fill-opacity","1")

}

var update_stats = function(){

	// In every entry of reward, change it to the actual performance.
	rws=d3.selectAll("#reward")[0]
	for (i=0;i<rws.length;i++)
		rws[i].innerHTML = session["acc_rwd"]*100

	parms = default_params()

	$("#total_trials")[0].innerHTML = params["total_trials"]
	$("#max_reward")[0].innerHTML = params["max_reward"]

}

var Questionnaire = function() {

	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	record_responses = function() {

		psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'submit'});

		$('textarea').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});
		$('select').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);		
		});

	};

	prompt_resubmit = function() {
		document.body.innerHTML = error_message;
		$("#resubmit").click(resubmit);
	};

	resubmit = function() {
		document.body.innerHTML = "<h1>Trying to resubmit...</h1>";
		reprompt = setTimeout(prompt_resubmit, 10000);
		
		psiTurk.saveData({
			success: function() {
			    clearInterval(reprompt); 
                psiTurk.computeBonus('compute_bonus', function(){finish()}); 
			}, 
			error: prompt_resubmit
		});
	};

	// Load the questionnaire snippet 
	psiTurk.showPage('postquestionnaire.html');
	psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'begin'});
	
	$("#next").click(function () {
	    record_responses();
	    psiTurk.saveData({
            success: function(){
                psiTurk.computeBonus('compute_bonus', function() {
                	psiTurk.completeHIT(); // when finished saving compute bonus, the quit
                }); 
            }, 
            error: prompt_resubmit});
	});
    
	
};
