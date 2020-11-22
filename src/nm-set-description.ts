// Require all
var sketch: Sketch = require('sketch');

function swapDescription(symbolInstance: SymbolInstance, value: string) {
  if (symbolInstance.master.getLibrary() && symbolInstance.master.getLibrary().name.includes("sunco-header")) {
    symbolInstance.overrides.forEach(override => {
      if (override.affectedLayer.name === "✏️Description"){
        override.value = value
      }
    })
  }
}

export default function() {
  sketch.UI.getInputFromUser(
    "What is the new description?",
    {
      initialValue: 'Elevate the conversation',
    },
    (err, value) => {
      if (err) {
        // most likely the user canceled the input
        return
      } else {
        sketch.getSelectedDocument().pages.forEach(page => {
          page.layers.forEach(layer => {
            if (layer.type ==  'SymbolInstance') {
              swapDescription(layer as SymbolInstance, value)
            } else if (layer.type ==  'Artboard' || layer.type == "SymbolMaster") {
              const container = layer as Layer
              container.layers.forEach(layer => {
                if (layer.type == 'SymbolInstance'){
                  swapDescription(layer as SymbolInstance, value)
                }
              })
            }
          })
        })
      }
    }
  )
}
