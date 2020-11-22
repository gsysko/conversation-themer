import { cleanID } from "./sketch-utils";

// Require all
var sketch: Sketch = require('sketch');

var botLayerStyleID: string

function foundBotLayerStyle() {
  sketch.getSelectedDocument().sharedLayerStyles.forEach(layerStyle => {
    if (layerStyle.name == 'avatars/bot') {
      botLayerStyleID = cleanID(layerStyle.id)
    }
  })
  return botLayerStyleID ? true : false
}

function swapBotLabels(symbolInstance: SymbolInstance, value: string) {
  let index = 0
  symbolInstance.overrides.forEach(override => {
    if (override.property === "layerStyle" && typeof override.value === "string") {
      if (cleanID(override.value) === botLayerStyleID){
        let botLabelOverride = symbolInstance.overrides[index - 5]
        if (botLabelOverride.affectedLayer.name === "✏️Label") {
            botLabelOverride.value = value
        }
      }
    }
    index++
  })
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
              } else if (layer.type ==  'Artboard' || layer.type ==  'SymbolMaster') {
                const symbolMaster = layer as Layer
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
