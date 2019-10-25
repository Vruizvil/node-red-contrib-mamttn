const MAM = require('@iota/mam');
const IOTA_CONVERTER = require('@iota/converter')
const { isAddress } = require('@iota/validators');

module.exports = function(RED) {
    function mamFetch(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.iotaNode = RED.nodes.getNode(config.iotaNode);
        //console.log("MAM Fetch INIT on iota node: " + node.iotaNode.host + ":" + node.iotaNode.port);
        node.on('input', function(msg) {
          if (isAddress(msg.payload)) {
            config.root = msg.payload;
          }
          //console.log("searching address: "+config.root);


          //console.log("MAM fetch on iota node: " + node.iotaNode.host + ":" + node.iotaNode.port);
          console.log("MAM root: " + config.root);
          console.log("MAM mode: " + config.mode);
          //console.log("MAM secret: " + config.secret);
          //console.log("Fetching data ... ");

          let mamState = MAM.init({ provider: node.iotaNode.host, 'port': node.iotaNode.port });
          let root = config.root.slice(0,81);
          if (config.mode == 'restricted' && config.secret.length == 0) {
            console.log("Restricted mode: No MAM secret selected");
          }
          if (config.mode == 'public') {
            config.secret = null;
          }
          this.status({fill:"red",shape:"ring",text:"fetching"});
          let resp = MAM.fetch(root, config.mode, config.secret, (result) => {
            let jsonArray = JSON.parse(IOTA_CONVERTER.trytesToAscii(result));
            for (var i = 0; i < jsonArray.length; i++) {
              node.send({payload: jsonArray[i]});
              // console.log(jsonArray[i])
            }
          }, config.limit);
          this.status({});
        });
    }
    RED.nodes.registerType("mamFetch",mamFetch);
}
