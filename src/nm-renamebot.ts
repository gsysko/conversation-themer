//import FileFormat from '@sketch-hq/sketch-file-format-ts'

import { cleanID } from "./sketch-utils";

// import { cleanID } from "./sketch-utils";

// Require all
var sketch: Sketch = require('sketch');

var botLayerStyle: SharedStyle

function foundBotLayerStyle() {
  sketch.getSelectedDocument().sharedLayerStyles.forEach(layerStyle => {
    if (layerStyle.name == 'avatars/bot') {
      // console.log("Found style " + layerStyle.id + " in " + layerStyle.getLibrary().name)
      botLayerStyle = layerStyle
    }
  })
  return botLayerStyle ? true : false
}

function swapBotLabels(symbolInstance: SymbolInstance, value: string) {
  for (var index = 0; index < symbolInstance.overrides.length; index++)
  {
    const override = symbolInstance.overrides[index]
    if (override.property === "layerStyle" && typeof override.value === "string") {
      // console.log("Checking " + cleanID(override.value) + " against " + cleanID(botLayerStyle.id))
      if (cleanID(override.value) === cleanID(botLayerStyle.id)){
        // console.log("Found " + override.affectedLayer.name + " in " + symbolInstance.name)
        const botLabelOverride = symbolInstance.overrides[index - 5]
        if (botLabelOverride.affectedLayer.name == "✏️Label") {
            // console.log("Overriding" + override.affectedLayer.name)
            botLabelOverride.value = value
        }
      }
    }
  }
}

export default function() {
  sketch.UI.getInputFromUser(
    "What is the bot's name?",
    {
      initialValue: 'Answer Bot',
    },
    (err, value) => {
      if (err) {
        // most likely the user canceled the input
        return
      } else {
        if (foundBotLayerStyle()) {
          sketch.getSelectedDocument().pages.forEach(page => {
            page.layers.forEach(layer => {
              if (layer.type ==  'SymbolInstance') {
                swapBotLabels(layer as SymbolInstance, value)
              } else if (layer.type ==  'SymbolMaster') {
                const symbolMaster = layer as SymbolMaster
                symbolMaster.layers.forEach(layer => {
                  if (layer.type == 'SymbolInstance'){
                    swapBotLabels(layer as SymbolInstance, value)
                  }
                })
              }
            })
          })
        }
      }
    }
  )
}
