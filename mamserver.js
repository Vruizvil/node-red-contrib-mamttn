module.exports = function(RED) {
    function mamserver(n) {
        RED.nodes.createNode(this,n);
        this.host = n.host;
        this.port = n.port;
        //host and port for iota provider
    }
    RED.nodes.registerType("mamserver",mamserver);
}
