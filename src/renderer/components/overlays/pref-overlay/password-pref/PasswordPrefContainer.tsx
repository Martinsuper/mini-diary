import { connect } from "react-redux";

import { updatePassword } from "../../../../store/file/actionCreators";
import { ThunkDispatchT } from "../../../../store/store";
import PasswordPref, { DispatchProps } from "./PasswordPref";

const mapDispatchToProps = (dispatch: ThunkDispatchT): DispatchProps => ({
	updatePassword: async (password: string): Promise<void> => {
		await dispatch(updatePassword(password));
	},
});

export default connect(null, mapDispatchToProps)(PasswordPref);
