import { connect } from "react-redux";

import { updateMarkdownShortcutsPref } from "../../../../../store/app/actionCreators";
import { RootState, ThunkDispatchT } from "../../../../../store/store";
import MarkdownShortcutsPref, { DispatchProps, StateProps } from "./MarkdownShortcutsPref";

const mapStateToProps = (state: RootState): StateProps => ({
	enableMarkdownShortcuts: state.app.enableMarkdownShortcuts,
});
const mapDispatchToProps = (dispatch: ThunkDispatchT): DispatchProps => ({
	updateMarkdownShortcutsPref: (enabled: boolean): void =>
		dispatch(updateMarkdownShortcutsPref(enabled)),
});
export default connect(mapStateToProps, mapDispatchToProps)(MarkdownShortcutsPref);
