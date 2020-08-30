self.importScripts("./source.js");
/*
function worker_function()
{
	console.log("hi");
	self.onmessage = event =>
	{
		alert("hell");
		df = event.data["func"];
		Function(df + "();");
	}	
}

if (window != self)
	worker_function();
*/
self.onmessage = event =>
{
	df = event.data["func"];
	Function(df + "();");
}	
