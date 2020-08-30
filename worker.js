self.importScripts("./source.js");

self.onmessage = event =>
{
	event.data[DrawFunc]();
}