const MAM = require('@iota/mam');
const { asciiToTrytes, trytesToAscii, trits, trytes, value, fromValue } = require('@iota/converter');
const { isTrytes } = require('@iota/validators');
var { data, application } = require('ttn');
const { generateAddress } = require('@iota/core');

module.exports = function(RED) {
    function ttntomam(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.iotaNode = RED.nodes.getNode(config.iotaNode);
      	//const iota = new IOTA({'host': this.iotaNode.host, 'port': this.iotaNode.port});
        //console.log("MAM publish INIT on iota node: " + node.iotaNode.host + ":" + node.iotaNode.port);
        if (config.channelseed != null && config.channelseed != "") {
          if (isTrytes(config.channelseed,81)) {
            //console.log("Right User Channel Seed");
          }  else {
              config.channelseed = null;
              //console.log("Wrong user Channel Seed, generated random seed");
              let name = 'seed de prueba';
              console.log(name);
              name = name.toUpperCase().replace(/\s/g,"");
              config.channelseed = generateAddress(name, 1, 2, false);
              //console.log(result);
            }
        }
        const appID = 'iotopentech';
        const accessKey = 'ttn-account-v2.hLI6TVUdL4uPkXgUECKvvnDlLm2nvlSSj24ciHOth_Q';



        node._state = MAM.init({ provider: node.iotaNode.host, 'port': node.iotaNode.port },config.channelseed,2);
        //console.log('GetRootInit: ' + MAM.getRoot(node._state));
        node._state = MAM.changeMode(node._state, config.mode, config.sidkey);
        //console.log('GetRootMode: ' + MAM.getRoot(node._state));
        node.tag = config.tag;
        node.readyMAM = true;
        node.arrayPackets = [];
        node.mamLink = 'https://mam-explorer.firebaseapp.com/?provider=' + node.iotaNode.host + ':' + node.iotaNode.port + '&mode=' + config.mode + '&root=';
        node.tangleLink = 'https://thetangle.org/address/'

        node.on('input', function(msg) {
            let trytestag = asciiToTrytes(JSON.stringify(node.tag));
            const packet = { time: Date.now(), tag: trytestag, data: msg.payload };
            this.arrayPackets.push(packet);
            //console.log(this.arrayPackets.length);
            //console.log(JSON.stringify(this.arrayPackets));
            //console.log(this.readyMAM);
            const pub = async packet => {
                    message = MAM.create(node._state,asciiToTrytes(JSON.stringify(this.arrayPackets)));
                    node._state = message.state;
                    resp = await MAM.attach(message.payload, message.address,4,14,'IC');
                    //resp.then(function(result) {
                              console.log(message);
            //                  console.log(resp);
                    //})
            }

            const main = async function () {
              const client = await data(appID, accessKey)

              client
                .on("uplink", function (devID, payload) {
                  //console.log("Received uplink from ", devID)
                  console.log(payload)
                  pub(payload);
                  // send downlink
                  //client.send(devID, "0xF",1,false,'replace');
                  //console.log("Sending download to ", devID);
                })
            }

            main().catch(function (err) {
              console.error(err)
              process.exit(1)
            })


            if (this.readyMAM) {
              this.status({fill:"red",shape:"ring",text:"publishing"});
              this.readyMAM = false;
              let trytes = IOTA_CONVERTER.asciiToTrytes(JSON.stringify(this.arrayPackets));
              let message = MAM.create(this._state, trytes);
              // Update the mam state so we can keep adding messages.
              this._state = message.state;
              //console.log("Uploading dataset via MAM Attach.");
              let link2 = node.tangleLink + message.address;
              let resp = MAM.attach(message.payload, message.address,4,14,trytestag);
              resp.then(function(result) {
                 //console.log(result); //will log results.
                 //console.log('Verify with MAM Explorer: '  + node.mamLink + message.root);
                 let link = node.mamLink + message.root;
                 node.send({payload: {address:message.address, root:message.root, state:message.state, link:link, tangleLink:link2}});
              });
              this.status({});
              this.readyMAM = true;
              this.arrayPackets = [];
            } else {

            }
        });
    }
    RED.nodes.registerType("ttntomam",ttntomam);
}
