type SearchSuccessResult = {
    redirectUrl: string;
};

type SearchSuccessActions = {
    closeSuggestions: () => void;
    closeSheet: () => void;
    navigate: (destination: string) => void;
};

type SearchFailureVariables = {
    query: string;
};

type SearchFailureActions = {
    closeSheet: () => void;
    navigateWithQuery: (query: string) => void;
};

export function applySearchSuccess(
    result: SearchSuccessResult,
    actions: SearchSuccessActions
) {
    actions.closeSuggestions();
    actions.closeSheet();
    actions.navigate(result.redirectUrl);
}

export function applySearchFailure(
    variables: SearchFailureVariables,
    actions: SearchFailureActions
) {
    actions.closeSheet();
    actions.navigateWithQuery(variables.query);
}
