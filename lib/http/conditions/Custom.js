module.exports = function (nit, http)
{
    return http.defineCondition ("Custom")
        .field ("<checker>", "function", "The condition checker.")
        .onCheck (function (ctx, owner)
        {
            return !!this.checker (ctx, owner);
        })
    ;
};
