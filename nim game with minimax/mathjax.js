MathJax = {
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']]
    },

    svg: {
            scale: 1,                      // global scaling factor for all expressions
            minScale: .5,                  // smallest scaling factor to use
            mtextInheritFont: false,       // true to make mtext elements use surrounding font
            merrorInheritFont: true,       // true to make merror text use surrounding font
            mathmlSpacing: false,          // true for MathML spacing rules, false for TeX rules
            skipAttributes: {},            // RFDa and other attributes NOT to copy to the output
            exFactor: .5,                  // default size of ex in em units
            displayAlign: 'center',        // default for indentalign when set to 'auto'
            displayIndent: '0',            // default for indentshift when set to 'auto'
            fontCache: 'local',            // or 'global' or 'none'
            localID: null,                 // ID to use for local font cache (for single equation processing)
            internalSpeechTitles: true,    // insert <title> tags with speech content
            titleID: 0                     // initial id number to use for aria-labeledby titles
        },

    options: {
        enableMenu: false,          // set to false to disable the menu
        menuOptions: {
            settings: {
                texHints: true,        // put TeX-related attributes on MathML
                semantics: false,      // put original format in <semantic> tag in MathML
                zoom: 'NoZoom',        // or 'Click' or 'DoubleClick' as zoom trigger
                zscale: '300%',        // zoom scaling factor
                renderer: 'SVG',     // or 'SVG'
                alt: false,            // true if ALT required for zooming
                cmd: false,            // true if CMD required for zooming
                ctrl: false,           // true if CTRL required for zooming
                shift: false,          // true if SHIFT required for zooming
                scale: 1,              // scaling factor for all math
                inTabOrder: true,      // true if tabbing includes math

                assistiveMml: true,    // true if hidden assistive MathML should be generated for screen readers
                collapsible: false,    // true if complex math should be collapsible
                explorer: false,       // true if the expression explorer should be active
            },
        
            annotationTypes: {
                TeX: ['TeX', 'LaTeX', 'application/x-tex'],
                StarMath: ['StarMath 5.0'],
                Maple: ['Maple'],
                ContentMathML: ['MathML-Content', 'application/mathml-content+xml'],
                OpenMath: ['OpenMath']
            }
        }
    }
};
  
  (function () {
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
    script.async = true;
    document.head.appendChild(script);
  })();
  