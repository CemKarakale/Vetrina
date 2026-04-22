def fix_sql_error(error_message: str, original_sql: str) -> str:
    error_lower = error_message.lower()

    if "unknown column" in error_lower:
        return original_sql.replace("*", "id, name")

    if "syntax error" in error_lower:
        return original_sql + " LIMIT 10"

    if "no table" in error_lower:
        return "SELECT 'Veri bulunamadı' as result"

    return original_sql
