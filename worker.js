self.importScripts("./source.js");

self.onmessage = event =>
{
	Function(event.data + "();");
}