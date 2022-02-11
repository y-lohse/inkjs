LIST list = a, (b), c, (d), e
{list}
{(a, c) + (b, e)}
{(a, b, c) ^ (c, b, e)}
{(list ? (b, d, e)) + 0}
{(list ? (d, b)) + 0}
{(list !? (c)) + 0}
