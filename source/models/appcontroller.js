module.exports = {

	registeredapps: {},
	intervalfns: {},

	addApp: function (name, app) {
		this.registeredapps[name] = app;

		if(app.interval && app.intervalFn && app.interval >= 1000) {
			this.intervalfns[name] = app.intervalFn.bind(app);
			setInterval(app.intervalFn.bind(app), app.interval);
		}
	}



};
