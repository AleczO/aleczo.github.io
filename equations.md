

$$ \sigma^2 = s^2 = \frac{\sum_{i=1}^n(y_i - \bar{y}_i)}{n - 2} $$


$$ s^2 = \frac{(1-r^2) \sum_{i=1}^n(y_i - \bar{y})}{n-2} $$

$$ 1 - r^2 = \frac{\sum_{i=1}^n(y_i - \hat{y}_i)^2}{\sum_{i=1}^n(y_i - \bar{y})^2} $$

$$ (1 - r^2)\sum_{i=1}^n(y_i - \bar{y})^2  = \sum_{i=1}^n(y_i - \hat{y}_i)^2 $$

$$ \frac{(1 - r^2)\sum_{i=1}^n(y_i - \bar{y})^2}{n - 2}  = \frac{\sum_{i=1}^n(y_i - \hat{y}_i)^2}{n - 2} = s^2 $$



<br><br><br><br><br><br><br><br><br><br><br><br>


$$ \sum_{i=1}^n(y_i - \bar{y})^2 = \sum_{i=1}^n(y_i - \hat{y}_i)^2 + \sum_{i=1}^n  (\hat{y}_i - \bar{y})^2 $$

$$ \sum_{i=1}^n[(y_i - \hat{y}_i) + (\hat{y}_i - \bar{y})]^2 $$

$$ \sum_{i=1}^n(y_i - \hat{y}_i)^2 + 2\sum_{i=1}^n (y_i - \hat{y}_i)(\hat{y}_i - \bar{y}) + \sum_{i=1}^n(\hat{y}_i - \bar{y})^2  $$


$$ 2\sum_{i=1}^n (y_i - \hat{y}_i)(\hat{y}_i - \bar{y}) $$

<br>

$$ \hat{y}_i = \hat{\alpha} + \hat{\beta} x_i $$


$$ \hat{\alpha} = \bar{y} - \hat{\beta} \bar{x} $$ 

$$ \hat{y}_i = \bar{y} - \hat{\beta}\bar{x} + \bar{\beta}x_i $$

$$ \hat{y}_i = \bar{y} - \hat{\beta}(\bar{x} - x_i) $$


$$ = \sum_{i=1}^n (y_i - \hat{y}_i)(\hat{y}_i - \bar{y}) $$

$$ = \sum_{i=1}^n [(y_i - \bar{y}) - \beta(x_i - \bar{x})][\beta(x_i - \bar{x})] $$

$$ = \beta \sum_{i=1}^n (y_i - \bar{y})(x_i - \bar{x}) -  \beta^2 \sum_{i=1}^n (x_i - x)^2 $$

<br>

$$ \hat{\beta} = \frac{\sum_{i=1}^n(x_i - \bar{x})(y_i - \bar{y}) }{\sum_{i=1}^n (x_i - \bar{x})^2} $$

$$ \hat{\beta} {\sum_{i=1}^n (x_i - \bar{x})^2} = \sum_{i=1}^n(x_i - \bar{x})(y_i - \bar{y})  $$

<br>


$$ = \beta^2 \sum_{i=1}^n (x_i - \bar{x})^2 -  \beta^2 \sum_{i=1}^n (x_i - x)^2 = 0 $$