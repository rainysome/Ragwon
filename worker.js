self.importScripts("./source.js");

self.onmessage = event =>
{
	df = event.data["func"];
	Function(df + "();");
}