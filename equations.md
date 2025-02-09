

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

<br><br><br><br><br><br>


$$ r = \frac{ \sum_{i=1}^n(x_i - \bar{x})(y_i - \bar{y}) } { \sqrt{\sum_{i=1}^n(x_i - \bar{x})^2} \sqrt{\sum_{i=1}^n(y_i - \bar{y})^2} }
$$


$$ r\frac{\sqrt{\sum_{i=1}^n (y_i - \bar{y})^2}}{\sqrt{\sum_{i=1}^n (x_i - \bar{x})^2}} $$

$$ r\frac{s_y}{s_x} = \frac{ \sum_{i=1}^n(x_i - \bar{x})(y_i - \bar{y}) } { \sqrt{\sum_{i=1}^n(x_i - \bar{x})^2} \sqrt{\sum_{i=1}^n(y_i - \bar{y})^2}}
\frac{\sqrt{\sum_{i=1}^n (y_i - \bar{y})^2}}{\sqrt{\sum_{i=1}^n (x_i - \bar{x})^2}} 
$$


$$ = \frac{ \sum_{i=1}^n(x_i - \bar{x})(y_i - \bar{y}) } { \sum_{i=1}^n(x_i - \bar{x})^2} = \hat{\beta}
$$

<br>




$$ y_i - \bar{y} = -\hat{\beta}(x_i - \bar{x}) $$


$$ (y_i - \bar{y})^2 = \hat{\beta}^2 (x_i - \bar{x})^2 $$

$$ \sum_{i=1}^n (y_i - \bar{y})^2 = \hat{\beta}^2\sum_{i=1}^n (x_i - \bar{x})^2 $$


$$ \hat{\beta}^2 = \frac{\sum_{i=1}^n (y_i - \bar{y})^2} {\sum_{i=1}^n (x_i - \bar{x})^2} $$





# $\alpha$ and $\beta$ Derivation


$$ \frac{\partial Q}{\partial \hat{\alpha}} = -2\sum_{i=1}^n (y_i - \hat{\alpha} - \hat{\beta}x_i) = 0 $$ 

$$ \frac{\partial Q}{\partial \hat{\beta}} = -2\sum_{i=1}^n x_i(y_i - \hat{\alpha} - \hat{\beta}x_i) = 0 $$ 

<br>


From 
$$ \frac{\partial Q}{\partial \hat{\alpha}} = 0 $$ 

$$ -2\sum_{i=1}^n (y_i - \hat{\alpha} - \hat{\beta}x_i) = 0 $$ 

$$ \sum_{i=1}^n (y_i - \hat{\alpha} - \hat{\beta}x_i) = 0 $$ 

$$ \sum_{i=1}^n y_i - \hat{\alpha} \sum_{i=1}^n - \hat{\beta}\sum_{i=1}^n x_i = 0 $$

$$ n \bar{y} - n\hat{\alpha} - \hat{\beta}n \bar{x} = 0 $$

$$ \bar{y} - \hat{\alpha} - \hat{\beta} \bar{x} = 0 $$

solving for \( \alpha \)

$$ \hat{\alpha} = \bar{y} - \hat{\beta} \bar{x}  $$



# Beta Calcuation


$$  \frac{\partial Q}{\partial \hat{\beta}} = 0  $$

$$ -2\sum_{i=1}^n x_i(y_i - \hat{\alpha} - \hat{\beta}x_i) = 0 $$

$$ -\sum_{i=1}^n x_iy_i + \hat{\alpha}\sum_{i=1}^n x_i + \hat{\beta} \sum_{i=1}^n x_i^2 = 0 $$

$$ (\bar{y} - \hat{\beta} \bar{x}) n\bar{x} + \hat{\beta} \sum_{i=1}^n x_i^2 = \sum_{i=1}^n x_iy_i  $$

$$ n\bar{y}\bar{x} - n\hat{\beta} \bar{x}^2 + \hat{\beta} \sum_{i=1}^n x_i^2 = \sum_{i=1}^n x_iy_i  $$


$$  \hat{\beta} (-n\bar{x}^2 +  \sum_{i=1}^n x_i^2)  = \sum_{i=1}^n x_iy_i - n\bar{x} \bar{y} $$

$$  \hat{\beta}  = \frac{\sum_{i=1}^n x_iy_i - \bar{x} \bar{y}}{\sum_{i=1}^n x_i^2-n\bar{x}^2} $$


# Numerator 


$$ \sum_{i=1}^n x_iy_i - n\bar{x} \bar{y} = $$


$$ = \sum_{i=1}^n x_iy_i - n\bar{x} \bar{y} - n\bar{x} \bar{y} + n\bar{x} \bar{y}  $$ 

$$ = \sum_{i=1}^n x_iy_i - \bar{y}\sum_{i=1}^n x_i  - \bar{x}\sum_{i=1}^n y_i + \sum_{i=1}^n \bar{x} \bar{y} $$ 


$$ = \sum_{i=1}^n ( x_iy_i - \bar{y} x_i  - \bar{x} y_i +  \bar{x} \bar{y}) $$

$$ = \sum_{i=1}^n [  x_i (y_i - \bar{y}) - \bar{x} ( y_i - \bar{y} ) ] $$

$$ = \sum_{i=1}^n ( y_i - \bar{y} ) (x_i - \bar{x}) $$

# Denominator


$$ \sum_{i=1}^n x_i^2-n\bar{x}^2 = $$

$$ = \sum_{i=1}^n x_i^2  - 2n\bar{x}^2 + n\bar{x}^2  $$

$$ = \sum_{i=1}^n x_i^2  - 2\bar{x} n\bar{x} + n\bar{x}^2 $$

$$ = \sum_{i=1}^n x_i^2  - 2\bar{x} \sum_{i=1}^n x_i + \sum_{i=1}^n\bar{x}^2 $$

$$ = \sum_{i=1}^n (x_i^2 - 2\bar{x} x_i + \bar{x}^2) $$

$$ = \sum_{i=1}^n (x_i -\bar{x})^2 $$