import { connect } from "react-redux";

import { runImport } from "../../../store/import/actionCreators";
import { RootState, ThunkDispatchT } from "../../../store/store";
import ImportOverlay, { DispatchProps, StateProps } from "./ImportOverlay";

const mapStateToProps = (state: RootState): StateProps => ({
	importFormat: state.import.importFormat,
	importStatus: state.import.importStatus,
	importErrorMsg: state.import.importErrorMsg,
});

const mapDispatchToProps = (dispatch: ThunkDispatchT): DispatchProps => ({
	runImport: (content: string): void => dispatch(runImport(content)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ImportOverlay);
