module.exports = function (nit, http)
{
    return http.defineCondition ("Custom")
        .field ("<checker>", "function", "The condition checker.")
        .method ("check", function (ctx, owner)
        {
            return !!this.checker (ctx, owner);
        })
    ;
};
