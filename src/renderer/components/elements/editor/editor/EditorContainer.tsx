import { connect } from "react-redux";

import { updateEntry } from "../../../../store/file/actionCreators";
import { RootState, ThunkDispatchT } from "../../../../store/store";
import { IndexDate, MarkdownEditorMode } from "../../../../types";
import { updateMarkdownEditorMode } from "../../../../store/app/actionCreators";
import Editor, { DispatchProps, StateProps } from "./Editor";

const mapStateToProps = (state: RootState): StateProps => ({
	enableMarkdownShortcuts: state.app.enableMarkdownShortcuts,
	enableSpellcheck: state.app.enableSpellcheck,
	hideTitles: state.app.hideTitles,
	markdownEditorMode: state.app.markdownEditorMode,
	dateSelected: state.diary.dateSelected,
	entries: state.file.entries,
});

const mapDispatchToProps = (dispatch: ThunkDispatchT): DispatchProps => ({
	updateEntry: (entryDate: IndexDate, title: string, text: string): void =>
		dispatch(updateEntry(entryDate, title, text)),
	updateMarkdownEditorMode: (mode: MarkdownEditorMode): void =>
		dispatch(updateMarkdownEditorMode(mode)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Editor);
