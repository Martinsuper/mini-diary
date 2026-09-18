import { connect } from "react-redux";

import { search } from "../../../../store/diary/actionCreators";
import { RootState, ThunkDispatchT } from "../../../../store/store";
import SearchBar, { DispatchProps, StateProps } from "./SearchBar";

const mapStateToProps = (state: RootState): StateProps => ({
	searchKey: state.diary.searchKey,
});

const mapDispatchToProps = (dispatch: ThunkDispatchT): DispatchProps => ({
	search: (searchKey: string): void => dispatch(search(searchKey)),
});

export default connect(mapStateToProps, mapDispatchToProps)(SearchBar);
