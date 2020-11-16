import { _Sketch } from "sketch/sketch";

export function cleanID(dirtyId: string) {
    let bracketCheck = new RegExp('\\[(.*)\\]')
    const cleanId = dirtyId.match(bracketCheck)
    return cleanId? cleanId[1] : dirtyId
}