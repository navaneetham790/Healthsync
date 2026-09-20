import { Navigate } from "react-router-dom";

/*
    Simple authentication check
    (Later backend login token use pannalaam)
*/

function PrivateRoute({ children }) {

    const isLoggedIn = localStorage.getItem("auth") === "true";

    if (!isLoggedIn) {

        return <Navigate to="/login" />;

    }

    return children;

}

export default PrivateRoute;