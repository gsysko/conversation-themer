import nmRenamebot from "./nm-renamebot";
import nmSetDescription from "./nm-set-description";
import nmSetTitle from "./nm-set-title";
import nmSwaplibrary from "./nm-swaplibrary";

export default function() {
    nmSwaplibrary()
    nmSetTitle()
    nmSetDescription()
    nmRenamebot()
}