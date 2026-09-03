import { connect } from "react-redux";

import { createEncryptedFile } from "../../../../store/file/actionCreators";
import { ThunkDispatchT } from "../../../../store/store";
import PasswordCreation, { DispatchProps } from "./PasswordCreation";

const mapDispatchToProps = (dispatch: ThunkDispatchT): DispatchProps => ({
	createEncryptedFile: (password: string): void => dispatch(createEncryptedFile(password)),
});

export default connect(null, mapDispatchToProps)(PasswordCreation);
