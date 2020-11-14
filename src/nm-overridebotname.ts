//import FileFormat from '@sketch-hq/sketch-file-format-ts'

// Require all
var sketch: Sketch = require('sketch');

export default function() {


  let document = sketch.Document.getSelectedDocument()

  sketch.UI.getInputFromUser(
    "What is the bot's existing name?",
    {
      initialValue: 'Answer Bot ‧ Bot',
    },
    (err, firstvalue) => {
      if (err) {
        // most likely the user canceled the input
        return
      } else {
        sketch.UI.getInputFromUser(
          "What is the bot's new name?",
          {
            type: sketch.UI.INPUT_TYPE.string,
          },
          (err, secondvalue:string) => {
            if (err) {
              // most likely the user canceled the input
              return
            } else {
              document.getSymbols().forEach(symbolMaster => {
                symbolMaster.getAllInstances().forEach(symbolInstance => {
                  symbolInstance.overrides.forEach(override => {
                    if(override.property === "stringValue") {
                      if (override.affectedLayer.name === "✏️ label") {
                          if (override.value === firstvalue) {
                            console.log(override.affectedLayer.name)
                            override.value = secondvalue
                          }
                      }
                    }
                  })
                })
              });
            }
          }
        )
      }
    }
  )
}
