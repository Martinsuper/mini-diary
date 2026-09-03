import { connect } from "react-redux";

import { RootState } from "../../../store/store";
import PrefOverlay, { StateProps } from "./PrefOverlay";

const mapStateToProps = (state: RootState): StateProps => ({
	isUnlocked: state.file.isUnlocked,
});

export default connect(mapStateToProps)(PrefOverlay);
