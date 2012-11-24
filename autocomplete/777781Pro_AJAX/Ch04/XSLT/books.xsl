<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" omit-xml-declaration="yes" indent="yes" />
  <xsl:template match="/">

    <html>
      <head>
        <link rel="stylesheet" type="text/css" href="ie/books.css" />
        <title>XSL Transformations</title>
      </head>
      <body>
        <xsl:apply-templates />
      </body>
    </html>

  </xsl:template>

  <xsl:template match="book">
    <div class="bookContainer">
      <xsl:variable name="varIsbn" select="@isbn" />
      <xsl:variable name="varTitle" select="title" />
      <img class="bookCover" alt="{$varTitle}" src="ie/images/{$varIsbn}.png" />
      <div class="bookContent">
        <h3>
          <xsl:value-of select="$title" />
        </h3>
        Written by: <xsl:value-of select="author" /><br />
        ISBN #<xsl:value-of select="$varIsbn" />
        <div class="bookPublisher">
          <xsl:value-of select="publisher" />
        </div>
      </div>
    </div>
  </xsl:template>

</xsl:stylesheet>

